/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/*global gettext, StyledElements, Wirecloud */

(function () {

    "use strict";

    var ResourceDetailsView = function ResourceDetailsView(id, options) {
        var extra_context;

        this.mainview = options.catalogue;
        StyledElements.Alternative.call(this, id, options);

        extra_context = function (resource) {
            return {
                'details': function (options, context) {
                    var details, painter, i, entries, versions;

                    details = new StyledElements.StyledNotebook();

                    var select = new StyledElements.StyledSelect({'class': 'versions'});
                    entries = [];
                    versions = resource.getAllVersions();
                    for (i = 0; i < versions.length; i++) {
                        entries.push({
                            'label': 'v' + versions[i].text,
                            'value': versions[i].text
                        });
                    }
                    select.addEntries(entries);
                    details.addButton(select);
                    select.setDisabled(versions.length === 1);
                    select.setValue(resource.version.text);
                    select.addEventListener('change', function (select) {
                        resource.changeVersion(select.getValue());
                        this.mainview.createUserCommand('showDetails', resource)();
                    }.bind(this));

                    var main_description = details.createTab({'name': gettext('Main Info'), 'closable': false});
                    main_description.appendChild(this.main_details_painter.paint(resource));

                    if (resource.changelog) {
                        var changelog = details.createTab({'name': gettext('Change Log'), 'closable': false});
                        changelog.addEventListener('show', function () {
                            Wirecloud.io.makeRequest(this.mainview.catalogue.RESOURCE_CHANGELOG_ENTRY.evaluate(resource), {
                                method: 'GET',
                                onSuccess: function (response) {
                                    changelog.wrapperElement.innerHTML = response.responseText;
                                }.bind(this)
                            });
                        }.bind(this));
                    }

                    return details;
                }.bind(this)
            };
        }.bind(this);

        this.main_details_painter = new Wirecloud.ui.ResourcePainter(this.mainview, Wirecloud.currentTheme.templates['catalogue_main_resource_details_template'], this);
        this.resource_details_painter = new Wirecloud.ui.ResourcePainter(this.mainview, Wirecloud.currentTheme.templates['catalogue_resource_details_template'], this, extra_context);
    };
    ResourceDetailsView.prototype = new StyledElements.Alternative();

    ResourceDetailsView.prototype.view_name = 'details';

    ResourceDetailsView.prototype.buildStateData = function buildStateData(data) {
        data.resource = this.currentResource.uri;
    };

    ResourceDetailsView.prototype.paint = function paint(resource) {
        this.currentResource = resource;
        this.clear();
        this.appendChild(this.resource_details_painter.paint(resource));
    };

    Wirecloud.ui.WirecloudCatalogue.ResourceDetailsView = ResourceDetailsView;
})();