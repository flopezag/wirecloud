# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import jsonpatch

from django.core.cache import cache
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _
import six

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.cache import CacheableData
from wirecloud.commons.utils.http import authentication_required, build_error_response, get_absolute_reverse_url, get_current_domain, consumes, parse_json_request
from wirecloud.platform.models import Workspace
from wirecloud.platform.wiring.utils import generate_xhtml_operator_code, get_operator_cache_key


class WiringEntry(Resource):

    def handleMultiuser(self, request, new_variable, old_variable):
        new_value = new_variable["value"]

        if old_variable is not None:
            new_variable = old_variable
        else:
            new_variable["value"] = {"users": {}}

        new_variable["value"]["users"]["%s" % request.user.id] = new_value
        return new_variable

    def checkMultiuserWiring(self, request, new_wiring_status, old_wiring_status, can_update_secure=False):
        if new_wiring_status["connections"] != old_wiring_status["connections"]:
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        for operator_id, operator in six.iteritems(new_wiring_status['operators']):
            if operator_id not in old_wiring_status['operators']:
                return build_error_response(request, 403, _('You are not allowed to update this workspace'))

            old_operator = old_wiring_status['operators'][operator_id]
            if old_operator["name"] != operator["name"] or old_operator["id"] != operator["id"]:
                return build_error_response(request, 403, _('You are not allowed to update this workspace'))

            vendor, name, version = operator["name"].split("/")
            try:
                operator_preferences = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version).get_processed_info()["preferences"]
            except CatalogueResource.DoesNotExist:
                operator_preferences = None
            try:
                operator_properties = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version).get_processed_info()["properties"]
            except CatalogueResource.DoesNotExist:
                operator_properties = None

            # Check preferences
            for preference_name in operator['preferences']:
                old_preference = old_operator['preferences'][preference_name]
                new_preference = operator['preferences'][preference_name]

                if old_preference.get("hidden", False) != new_preference.get("hidden", False) or old_preference.get("readonly", False) != new_preference.get("readonly", False):
                    return build_error_response(request, 403, _('You are not allowed to update this workspace'))

                # Check if its multiuser
                preference_secure = False
                preference_multiuser = False
                if operator_preferences:
                    for pref in operator_preferences:
                        if pref["name"] == preference_name:
                            preference_secure = pref.get("secure", False)
                            preference_multiuser = pref.get("multiuser", False)
                            operator_preferences.remove(pref)  # Speed up search for next preferences
                            break

                # Variables can only be updated if multisuer
                if not preference_multiuser:
                    if old_preference["value"] != new_preference["value"]:
                        return build_error_response(request, 403, _('You are not allowed to update this workspace'))
                    else:
                        continue

                # Update variable value
                if preference_secure and not can_update_secure:
                    new_preference["value"] = old_preference["value"]
                elif new_preference["value"] != old_preference["value"]:
                    # Handle multiuser
                    new_preference = self.handleMultiuser(request, new_preference, old_preference)
                operator['preferences'][preference_name] = new_preference

            # Check properties
            for property_name in operator['properties']:
                old_property = old_operator['properties'][property_name]
                new_property = operator['properties'][property_name]

                if old_property.get("hidden", False) != new_property.get("hidden", False) or old_property.get("readonly", False) != new_property.get("readonly", False):
                    return build_error_response(request, 403, _('You are not allowed to update this workspace'))

                # Check if its multiuser
                property_secure = False
                property_multiuser = False
                if operator_properties:
                    for pref in operator_properties:
                        if pref["name"] == property_name:
                            property_secure = pref.get("secure", False)
                            property_multiuser = pref.get("multiuser", False)
                            operator_properties.remove(pref)  # Speed up search for next properties
                            break

                # Variables can only be updated if multisuer
                if not property_multiuser:
                    if old_property["value"] != new_property["value"]:
                        return build_error_response(request, 403, _('You are not allowed to update this workspace'))
                    else:
                        continue

                # Update variable value
                if property_secure and not can_update_secure:
                    new_property["value"] = old_property["value"]
                elif new_property["value"] != old_property["value"]:
                    # Handle multiuser
                    new_property = self.handleMultiuser(request, new_property, old_property)
                operator['properties'][property_name] = new_property

        return True

    def checkWiring(self, request, new_wiring_status, old_wiring_status, can_update_secure=False):
        # Check read only connections
        old_read_only_connections = [connection for connection in old_wiring_status['connections'] if connection.get('readonly', False)]
        new_read_only_connections = [connection for connection in new_wiring_status['connections'] if connection.get('readonly', False)]

        if len(old_read_only_connections) > len(new_read_only_connections):
            return build_error_response(request, 403, _('You are not allowed to remove or update read only connections'))

        for connection in old_read_only_connections:
            if connection not in new_read_only_connections:
                return build_error_response(request, 403, _('You are not allowed to remove or update read only connections'))
        # Check operator preferences and properties
        for operator_id, operator in six.iteritems(new_wiring_status['operators']):
            old_operator = None
            if operator_id in old_wiring_status['operators']:
                old_operator = old_wiring_status['operators'][operator_id]
                added_preferences = set(operator['preferences'].keys()) - set(old_operator['preferences'].keys())
                removed_preferences = set(old_operator['preferences'].keys()) - set(operator['preferences'].keys())
                updated_preferences = set(operator['preferences'].keys()).intersection(old_operator['preferences'].keys())

                added_properties = set(operator['properties'].keys()) - set(old_operator['properties'].keys())
                removed_properties = set(old_operator['properties'].keys()) - set(operator['properties'].keys())
                updated_properties = set(operator['properties'].keys()).intersection(old_operator['properties'].keys())
                vendor, name, version = operator["name"].split("/")
                try:
                    operator_preferences = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version).get_processed_info()["preferences"]
                except CatalogueResource.DoesNotExist:
                    operator_preferences = None
                try:
                    operator_properties = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version).get_processed_info()["preferences"]
                except CatalogueResource.DoesNotExist:
                    operator_properties = None
            else:
                # New operator
                added_preferences = operator['preferences'].keys()
                removed_preferences = ()
                updated_preferences = ()
                added_properties = operator['properties'].keys()
                removed_properties = ()
                updated_properties = ()

            # Handle preferences
            for preference_name in added_preferences:
                if operator['preferences'][preference_name].get('readonly', False) or operator['preferences'][preference_name].get('hidden', False):
                    return build_error_response(request, 403, _('Read only and hidden preferences cannot be created using this API'))

                # Handle multiuser
                new_preference = operator['preferences'][preference_name]
                new_preference["value"] = {"users": {"%s" % request.user.id: new_preference["value"]}}
                operator['preferences'][preference_name] = new_preference

            for preference_name in removed_preferences:
                if old_operator['preferences'][preference_name].get('readonly', False) or old_operator['preferences'][preference_name].get('hidden', False):
                    return build_error_response(request, 403, _('Read only and hidden preferences cannot be removed'))

            for preference_name in updated_preferences:
                old_preference = old_operator['preferences'][preference_name]
                new_preference = operator['preferences'][preference_name]

                # Check if the preference is secure
                preference_secure = False
                if operator_preferences:
                    for pref in operator_preferences:
                        if pref["name"] == preference_name:
                            preference_secure = pref.get("secure", False)
                            operator_preferences.remove(pref)  # Speed up search
                            break

                if old_preference.get('readonly', False) != new_preference.get('readonly', False) or old_preference.get('hidden', False) != new_preference.get('hidden', False):
                    return build_error_response(request, 403, _('Read only and hidden status cannot be changed using this API'))

                if new_preference.get('readonly', False) and new_preference.get('value') != old_preference.get('value'):
                    return build_error_response(request, 403, _('Read only preferences cannot be updated'))

                if preference_secure and not can_update_secure:
                    new_preference["value"] = old_preference["value"]
                elif new_preference["value"] != old_preference["value"]:
                    # Handle multiuser
                    new_preference = self.handleMultiuser(request, new_preference, old_preference)
                operator['preferences'][preference_name] = new_preference

            # Handle properties
            for property_name in added_properties:
                if operator['properties'][property_name].get('readonly', False) or operator['properties'][property_name].get('hidden', False):
                    return build_error_response(request, 403, _('Read only and hidden properties cannot be created using this API'))

                # Handle multiuser
                new_property = operator['properties'][property_name]
                new_property["value"] = {"users": {"%s" % request.user.id: new_property["value"]}}
                operator['properties'][property_name] = new_property

            for property_name in removed_properties:
                if old_operator['properties'][property_name].get('readonly', False) or old_operator['properties'][property_name].get('hidden', False):
                    return build_error_response(request, 403, _('Read only and hidden properties cannot be removed'))

            for property_name in updated_properties:
                old_property = old_operator['properties'][property_name]
                new_property = operator['properties'][property_name]

                # Check if the property is secure
                property_secure = False
                if operator_properties:
                    for prop in operator_properties:
                        if prop["name"] == property_name:
                            property_secure = prop.get("secure", False)
                            operator_properties.remove(prop)  # Speed up search
                            break

                if old_property.get('readonly', False) != new_property.get('readonly', False) or old_property.get('hidden', False) != new_property.get('hidden', False):
                    return build_error_response(request, 403, _('Read only and hidden status cannot be changed using this API'))

                if new_property.get('readonly', False) and new_property.get('value') != old_property.get('value'):
                    return build_error_response(request, 403, _('Read only properties cannot be updated'))

                if property_secure and not can_update_secure:
                    new_property["value"] = old_property["value"]
                elif new_property["value"] != old_property["value"]:
                    # Handle multiuser
                    new_property = self.handleMultiuser(request, new_property, old_property)
                operator['properties'][property_name] = new_property

        return True

    @authentication_required
    @consumes(('application/json',))
    def update(self, request, workspace_id):

        workspace = get_object_or_404(Workspace, id=workspace_id)

        new_wiring_status = parse_json_request(request)
        old_wiring_status = workspace.wiringStatus

        if workspace.creator == request.user or request.user.is_superuser:
            result = self.checkWiring(request, new_wiring_status, old_wiring_status, can_update_secure=True)
        elif workspace.is_available_for(request.user):
            result = self.checkMultiuserWiring(request, new_wiring_status, old_wiring_status, can_update_secure=True)
        else:
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        if result is not True:
            return result

        workspace.wiringStatus = new_wiring_status
        workspace.save()

        return HttpResponse(status=204)

    @authentication_required
    @consumes(('application/json-patch+json',))
    def patch(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)

        old_wiring_status = workspace.wiringStatus
        try:
            new_wiring_status = jsonpatch.apply_patch(old_wiring_status, parse_json_request(request))
        except jsonpatch.JsonPointerException:
            return build_error_response(request, 422, _('Failed to apply patch'))
        except jsonpatch.InvalidJsonPatch:
            return build_error_response(request, 400, _('Invalid JSON patch'))

        if workspace.creator == request.user or request.user.is_superuser:
            result = self.checkWiring(request, new_wiring_status, old_wiring_status, can_update_secure=True)
        elif workspace.is_available_for(request.user):
            result = self.checkMultiuserWiring(request, new_wiring_status, old_wiring_status, can_update_secure=True)
        else:
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        if result is not True:
            return result
        workspace.wiringStatus = new_wiring_status
        workspace.save()

        return HttpResponse(status=204)


def process_requirements(requirements):

    return dict((requirement['name'], {}) for requirement in requirements)


class OperatorEntry(Resource):

    def read(self, request, vendor, name, version):

        operator = get_object_or_404(CatalogueResource, type=2, vendor=vendor, short_name=name, version=version)
        # For now, all operators are freely accessible/distributable
        # if not operator.is_available_for(request.user):
        #    return HttpResponseForbidden()

        mode = request.GET.get('mode', 'classic')

        key = get_operator_cache_key(operator, get_current_domain(request), mode)
        cached_response = cache.get(key)
        if cached_response is None:
            options = operator.json_description
            js_files = options['js_files']

            base_url = get_absolute_reverse_url('wirecloud.showcase_media', kwargs={
                'vendor': operator.vendor,
                'name': operator.short_name,
                'version': operator.version,
                'file_path': operator.template_uri
            }, request=request)

            xhtml = generate_xhtml_operator_code(js_files, base_url, request, process_requirements(options['requirements']), mode)
            cache_timeout = 31536000  # 1 year
            cached_response = CacheableData(xhtml, timeout=cache_timeout, content_type='application/xhtml+xml; charset=UTF-8')

            cache.set(key, cached_response, cache_timeout)

        return cached_response.get_response()
