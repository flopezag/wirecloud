/*---------------------------------------------------------------------------*
 *                               StyledElements                              *
 *---------------------------------------------------------------------------*/

/**
 * @abstract
 */
StyledElements.StyledElement = function(events) {
    StyledElements.ObjectWithEvents.call(this, events);
    this.wrapperElement = null;
    this.enabled = true;
}
StyledElements.StyledElement.prototype = new StyledElements.ObjectWithEvents();

/**
 * Inserta el elemento con estilo dentro del elemento indicado.
 *
 * @param element Este será el elemento donde se insertará el elemento con
 * estilo.
 * @param refElement Este parámetro es opcional. En caso de ser usado, sirve
 * para indicar delante de que elemento se tiene que añadir este elemento con
 * estilo.
 */
StyledElements.StyledElement.prototype.insertInto = function (element, refElement) {
    if (element instanceof StyledElements.StyledElement) {
        element = element.wrapperElement;
    }

    if (refElement instanceof StyledElements.StyledElement) {
        refElement = refElement.wrapperElement;
    }

    if (refElement)
        element.insertBefore(this.wrapperElement, refElement);
    else
        element.appendChild(this.wrapperElement);
}

/**
 * @private
 */
StyledElements.StyledElement.prototype._getUsableHeight = function() {
    var parentElement = this.wrapperElement.parentNode;
    if (!Wirecloud.Utils.XML.isElement(parentElement)) {
        return null;
    }

    var parentStyle = document.defaultView.getComputedStyle(parentElement, null);
    if (parentStyle.getPropertyCSSValue('display') == null) {
        return null;
    }
    var containerStyle = document.defaultView.getComputedStyle(this.wrapperElement, null);

    var height = parentElement.offsetHeight -
                 parentStyle.getPropertyCSSValue('padding-top').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 parentStyle.getPropertyCSSValue('padding-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 containerStyle.getPropertyCSSValue('padding-top').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 containerStyle.getPropertyCSSValue('padding-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 containerStyle.getPropertyCSSValue('border-top-width').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 containerStyle.getPropertyCSSValue('border-bottom-width').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 containerStyle.getPropertyCSSValue('margin-top').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 containerStyle.getPropertyCSSValue('margin-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX);

    return height;
}

/**
 * @private
 */
StyledElements.StyledElement.prototype._getUsableWidth = function() {
    var parentElement = this.wrapperElement.parentNode;
    if (!Wirecloud.Utils.XML.isElement(parentElement))
        return null;

    var parentStyle = document.defaultView.getComputedStyle(parentElement, null);
    var containerStyle = document.defaultView.getComputedStyle(this.wrapperElement, null);

    var width = parentElement.offsetWidth -
                parentStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                parentStyle.getPropertyCSSValue('padding-right').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                containerStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                containerStyle.getPropertyCSSValue('padding-right').getFloatValue(CSSPrimitiveValue.CSS_PX);

    return width;
}

/**
 * Esta función sirve para repintar el componente.
 *
 * @param {Boolean} temporal Indica si se quiere repintar el componente de
 * forma temporal o de forma permanente. Por ejemplo, cuando mientras se está
 * moviendo el tirador de un HPaned se llama a esta función con el parámetro
 * temporal a <code>true</code>, permitiendo que los componentes intenten hacer
 * un repintado más rápido (mejorando la experiencia del usuario); y cuando el
 * usuario suelta el botón del ratón se ejecuta una última vez esta función con
 * el parámetro temporal a <code>false</code>, indicando que el usuario ha
 * terminado de mover el tirador y que se puede llevar a cabo un repintado más
 * inteligente. Valor por defecto: <code>false</code>.
 */
StyledElements.StyledElement.prototype.repaint = function (temporal) {
}

/**
 *
 */
StyledElements.StyledElement.prototype.hasClassName = function(className) {
    return this.wrapperElement.classList.contains(className);
}

/**
 *
 */
StyledElements.StyledElement.prototype.addClassName = function(className) {
    var i, tokens;

    className = className.trim();
    if (className === '') {
        return;
    }

    tokens = className.split(/\s+/);
    for (i = 0; i < tokens.length; i++) {
        this.wrapperElement.classList.add(tokens[i]);
    }
};

/**
 *
 */
StyledElements.StyledElement.prototype.removeClassName = function(className) {
    var i, tokens;

    className = className.trim();
    if (className === '') {
        return;
    }

    tokens = className.split(/\s+/);
    for (i = 0; i < tokens.length; i++) {
        this.wrapperElement.classList.remove(tokens[i]);
    }
};

StyledElements.StyledElement.prototype.setDisabled = function(disable) {
    if (disable) {
        this.disable();
    } else {
        this.enable();
    }
}

/**
 * Rehabilita el componente quitándole la clase css .disabled
 */
StyledElements.StyledElement.prototype.enable = function() {
    this.enabled = true;
    this.removeClassName('disabled');
}

/**
 * Deshabilita el componente añadiendo la clase css .disabled
 */
StyledElements.StyledElement.prototype.disable = function() {
    this.enabled = false;
    this.addClassName('disabled');
}

/*
 * @experimental
 */
StyledElements.StyledElement.prototype.getBoundingClientRect = function () {
    return this.wrapperElement.getBoundingClientRect();
};

/**
 * @abstract
 *
 * Esta clase contiene la lógica base de todos los elementos StyledElements que
 * corresponden con un elemento de entrada de datos valido tanto para usarlos
 * junto con formularios como sin ellos.
 */
StyledElements.StyledInputElement = function(defaultValue, events) {
    this.inputElement = null;
    this.defaultValue = defaultValue;

    StyledElements.StyledElement.call(this, events);
}
StyledElements.StyledInputElement.prototype = new StyledElements.StyledElement();

StyledElements.StyledInputElement.prototype.getValue = function () {
    return this.inputElement.value;
}

StyledElements.StyledInputElement.prototype.setValue = function (newValue) {
    this.inputElement.value = newValue;
}

StyledElements.StyledInputElement.prototype.reset = function () {
    this.setValue(this.defaultValue);
}

StyledElements.StyledInputElement.prototype.enable = function() {
    StyledElements.StyledElement.prototype.enable.call(this);
    this.inputElement.disabled = false;
}

StyledElements.StyledInputElement.prototype.disable = function() {
    StyledElements.StyledElement.prototype.disable.call(this);
    this.inputElement.disabled = true;
}

StyledElements.StyledInputElement.prototype.focus = function() {
    this.inputElement.focus();
}

/**
 *
 */
StyledElements.StyledHiddenField = function(options) {
    var defaultOptions = {
        'initialValue': '',
        'class': ''
    };
    options = Wirecloud.Utils.merge(defaultOptions, options);

    StyledElements.StyledInputElement.call(this, options.initialValue, []);

    this.wrapperElement = document.createElement("div");

    this.wrapperElement.className = Wirecloud.Utils.prependWord(options['class'], 'styled_hidden_field');

    this.inputElement = document.createElement("input");
    this.inputElement.setAttribute("type", "hidden");

    if (options['name'] !== undefined)
        this.inputElement.setAttribute("name", options['name']);

    if (options['id'] != undefined)
        this.wrapperElement.setAttribute("id", options['id']);

    this.inputElement.setAttribute("value", options['initialValue']);

    this.wrapperElement.appendChild(this.inputElement);
}
StyledElements.StyledHiddenField.prototype = new StyledElements.StyledInputElement();

/**
 * Este componente permite agrupar varios CheckBoxes o RadioButtons, con el
 * objetivo de tratarlos como un único campo de entrada, permitiendo obtener y
 * establecer su valor, escuchar eventos de modificación, etc... etc...
 */
StyledElements.ButtonsGroup = function(name_) {
    StyledElements.StyledInputElement.call(this, "", ['change']);

    this.name_ = name_;
    this.buttons = [];
}
StyledElements.ButtonsGroup.prototype = new StyledElements.StyledInputElement();

/**
 * Devuelve el nombre que tiene asignado este ButtonsGroup.
 */
StyledElements.ButtonsGroup.prototype.getName = function() {
    return this.name_;
}

/**
 * @private
 */
StyledElements.ButtonsGroup.prototype.insertButton = function(button) {
    this.buttons[this.buttons.length] = button;
    button.addEventListener('change',
                            function () {
                                var changeHandlers = this.events['change'].dispatch(this);
                            }.bind(this));
}

StyledElements.ButtonsGroup.prototype.getValue = function getValue() {
    var i, result = [];

    if (this.buttons[0] instanceof StyledElements.StyledCheckBox) {

        for (i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].inputElement.checked) {
                result.push(this.buttons[i].getValue());
            }
        }

    } else {

        for (i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].inputElement.checked) {
                return [this.buttons[i].getValue()];
            }
        }
    }

    return result;
}

StyledElements.ButtonsGroup.prototype.setValue = function(newValue) {
    if (newValue == null) {
        newValue = [];
    } else if (typeof newValue === 'string') {
        newValue = [newValue];
    }

    for (var i = 0; i < this.buttons.length; i++) {
        if (newValue.indexOf(this.buttons[i].inputElement.value) !== -1) {
            this.buttons[i].setValue(true);
        } else {
            this.buttons[i].setValue(false);
        }
    }
}

StyledElements.ButtonsGroup.prototype.reset = function() {
    for (var i = 0; i < this.buttons.length; i++) {
        this.buttons[i].reset();
    }
}

/**
 * Devuelve una lista de los elementos StyledCheckBox o StyledRadioButton
 * seleccionados. En caso de que la selección este vacía, este método devolverá
 * una lista vacía y en caso de que este ButtonGroup este formado por
 * StyledRadioButtons, la selección será como mucho de un elemento.
 */
StyledElements.ButtonsGroup.prototype.getSelectedButtons = function() {
    if (this.buttons.length === 0) {
        return [];
    }

    if (this.buttons[0] instanceof StyledElements.StyledCheckBox) {
        var result = [];

        for (var i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].inputElement.checked)
                result[result.length] = this.buttons[i];
        }

        return result;
    } else {
        for (var i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].inputElement.checked)
                return [this.buttons[i]];
        }
        return [];
    }
}

/**
 *
 */
StyledElements.StyledRadioButton = function StyledRadioButton(options) {
    var defaultOptions = {
        'initiallyChecked': false,
        'class': '',
        'group': null,
        'value': null
    };
    options = Wirecloud.Utils.merge(defaultOptions, options);

    StyledElements.StyledInputElement.call(this, options.initiallyChecked, ['change']);

    this.wrapperElement = document.createElement("input");

    this.wrapperElement.setAttribute("type", "radio");
    if (options.value != null) {
        this.wrapperElement.setAttribute("value", options.value);
    }
    this.inputElement = this.wrapperElement;

    if (options['name'] != null) {
        this.inputElement.setAttribute("name", options['name']);
    }

    if (options['id'] != null) {
        this.wrapperElement.setAttribute("id", options['id']);
    }

    if (options['initiallyChecked'] == true)
        this.inputElement.setAttribute("checked", true);

    if (options.group instanceof StyledElements.ButtonsGroup) {
        this.wrapperElement.setAttribute("name", options.group.getName());
        options.group.insertButton(this);
    } else if (typeof options.group === 'string') {
        this.wrapperElement.setAttribute("name", options.group);
    }

    /* Internal events */
    this.inputElement.addEventListener('mousedown', Wirecloud.Utils.stopPropagationListener, true);
    this.inputElement.addEventListener('click', Wirecloud.Utils.stopPropagationListener, true);
    this.inputElement.addEventListener('change',
                                function () {
                                    if (this.enabled)
                                        this.events['change'].dispatch(this);
                                }.bind(this),
                                true);
}
StyledElements.StyledRadioButton.prototype = new StyledElements.StyledInputElement();

StyledElements.StyledRadioButton.prototype.insertInto = function (element, refElement) {
    var checked = this.inputElement.checked; // Necesario para IE
    StyledElements.StyledElement.prototype.insertInto.call(this, element, refElement);
    this.inputElement.checked = checked; // Necesario para IE
}

StyledElements.StyledRadioButton.prototype.reset = function() {
    this.inputElement.checked = this.defaultValue;
}

StyledElements.StyledRadioButton.prototype.setValue = function(newValue) {
    this.inputElement.checked = newValue;
}

/**
 * El componente Styled HPaned crea dos paneles separados por un separador y
 * que permite redimensionar los dos paneles a la vez con el objetivo de que
 * siguan ocupando el mismo espacio en conjunto.
 *
 * @param options Opciones admitidas:
 *                -{Number} handlerPosition Indica la posición en la que estará
 *                 el separador inicialmente. Esta posición deberá ir indicada
 *                 en porcentajes. Valor por defecto: 50.
 *                -{Number} leftMinWidth Indica el tamaño mínimo que tendrá el
 *                 panel izquierdo del componente. Este tamaño mínimo tiene que
 *                 ir en pixels.
 *                -{Number} rightMinWidth Indica el tamaño mínimo que tendrá el
 *                 panel derecho del componente. Este tamaño mínimo tiene que
 *                 ir en pixels.
 */
StyledElements.StyledHPaned = function(options) {
    StyledElements.StyledElement.call(this, []);

    var defaultOptions = {
        'class': '',
        'full': true,
        'handlerPosition': 50,
        'leftContainerOptions': {'class': ''},
        'leftMinWidth': 0,
        'rightMinWidth': 0,
        'rightContainerOptions': {'class': ''}
    };
    options = Wirecloud.Utils.merge(defaultOptions, options);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = Wirecloud.Utils.prependWord(options['class'], "hpaned");

    /* Force leftpanel class */
    options.leftContainerOptions['class'] = Wirecloud.Utils.prependWord(options.leftContainerOptions['class'], 'leftpanel');
    options.leftContainerOptions['useFullHeight'] = true;
    this.leftPanel = new StyledElements.Container(options.leftContainerOptions);

    this.handler = document.createElement("div");
    this.handler.className = "handler";

    /* Force rightpanel class */
    options.rightContainerOptions['class'] = Wirecloud.Utils.prependWord(options.rightContainerOptions['class'], 'rightpanel');
    options.leftContainerOptions['useFullHeight'] = true;
    this.rightPanel = new StyledElements.Container(options.rightContainerOptions);

    this.leftPanel.insertInto(this.wrapperElement);
    this.wrapperElement.appendChild(this.handler);
    this.rightPanel.insertInto(this.wrapperElement);

    this.handlerPosition = options['handlerPosition'];
    this.leftMinWidth = options['leftMinWidth'];
    this.rightMinWidth = options['rightMinWidth'];

    /* Process other options */
    if (options['name'] !== undefined)
        this.inputElement.setAttribute("name", options['name']);

    if (options['id'] != undefined)
        this.wrapperElement.setAttribute("id", options['id']);

    if (options['full'])
        this.wrapperElement.classList.add('full');

    /*
     * Code for handling internal hpaned events
     */
    var hpaned = this;
    var xStart, handlerPosition, hpanedWidth;

    function endresize(e) {
        document.oncontextmenu = null; //reenable context menu
        document.onmousedown = null; //reenable text selection

        document.removeEventListener("mouseup", endresize, true);
        document.removeEventListener("mousemove", resize, true);

        hpaned.repaint(false);

        hpaned.handler.addEventListener("mousedown", startresize, true);
    }

    function resize(e) {
        var screenX = parseInt(e.screenX);
        xDelta = xStart - screenX;
        xStart = screenX;
        handlerPosition = hpanedWidth * (handlerPosition / 100);
        handlerPosition -= xDelta;
        handlerPosition = (handlerPosition / hpanedWidth) * 100;
        if (handlerPosition > 100)
            hpaned.handlerPosition = 100;
        else if (handlerPosition < 0)
            hpaned.handlerPosition = 0;
        else
            hpaned.handlerPosition = handlerPosition;

        hpaned.repaint(true);
    }

    function startresize(e) {
        document.oncontextmenu = function() { return false; }; //disable context menu
        document.onmousedown = function() { return false; }; //disable text selection
        hpaned.handler.removeEventListener("mousedown", startresize, true);

        xStart = parseInt(e.screenX);
        hpanedWidth = hpaned.wrapperElement.parentNode.offsetWidth - 5;
        handlerPosition = hpaned.handlerPosition;

        document.addEventListener("mousemove", resize, true);
        document.addEventListener("mouseup", endresize, true);
    }

    hpaned.handler.addEventListener("mousedown", startresize, true);
}
StyledElements.StyledHPaned.prototype = new StyledElements.StyledElement();

StyledElements.StyledHPaned.prototype.insertInto = function (element, refElement) {
    StyledElements.StyledElement.prototype.insertInto.call(this, element, refElement);

    this.repaint();
    window.addEventListener("resize",
                            this.repaint.bind(this),
                            true);
}

StyledElements.StyledHPaned.prototype.getLeftPanel = function () {
    return this.leftPanel;
}

StyledElements.StyledHPaned.prototype.getRightPanel = function () {
    return this.rightPanel;
}

StyledElements.StyledHPaned.prototype.repaint = function(temporal) {
    temporal = temporal !== undefined ? temporal: false;

    var height = this._getUsableHeight();
    if (height == null)
        return; // nothing to do

    // Height
    this.wrapperElement.style.height = (height + "px");

    // Width
    this.wrapperElement.style.width = "";

    var minWidth = this.leftMinWidth + this.rightMinWidth + this.handler.offsetWidth;
    var width = this._getUsableWidth() - this.handler.offsetWidth;
    if (width < minWidth) {
        width = minWidth;
        this.wrapperElement.style.width = width + "px";
    }

    var handlerMiddle = Math.floor(width * (this.handlerPosition / 100));

    var newLeftPanelWidth = handlerMiddle;
    if (newLeftPanelWidth <  this.leftMinWidth) {
        handlerMiddle += this.leftMinWidth - newLeftPanelWidth;
        newLeftPanelWidth = this.leftMinWidth;
    }

    var newRightPanelWidth = width - handlerMiddle;
    if (newRightPanelWidth <  this.rightMinWidth) {
        handlerMiddle -= this.rightMinWidth - newRightPanelWidth;
        newRightPanelWidth = this.rightMinWidth;
        newLeftPanelWidth = handlerMiddle;
    }

    /* Real width update */
    this.leftPanel.wrapperElement.style.width = newLeftPanelWidth + "px";
    this.rightPanel.wrapperElement.style.width = newRightPanelWidth + "px";
    this.handler.style.left = handlerMiddle + "px";

    /* Propagate resize event */
    this.leftPanel.repaint(temporal);
    this.rightPanel.repaint(temporal);
}

/**
 * @experimental
 *
 * Permite ejecutar secuencialmente distintos comandos. Dado que javascript no
 * tiene un interfaz para manejo de hilos, esto realmente sólo es necesario en
 * los casos en los que la concurrencia provenga a través de alguno de los
 * mecanismos de señales soportados por javascript (de momento, estos son los
 * eventos, los temporizadores y las peticiones asíncronas mediante el objeto
 * XMLHttpRequest).
 */
var CommandQueue = function (context, initFunc, stepFunc) {
    var running = false;
    var elements = new Array();
    var step = 0;
    var stepTimes = null;

    function doStep() {
        if (stepFunc(step, context)) {
            var timeDiff = stepTimes[step] - (new Date()).getTime();
            if (timeDiff < 0)
                timeDiff = 0

            step++;
            setTimeout(doStep, timeDiff);
        } else {
            doInit()
        }
    }

    function doInit() {
        var command;
        do {
            command = elements.shift();
        } while (command != undefined && !(stepTimes = initFunc(context, command)));

        if (command != undefined) {
            step = 0;
            var timeDiff = stepTimes[step] - (new Date()).getTime();
            if (timeDiff < 0)
                timeDiff = 0
            setTimeout(doStep, timeDiff);
        } else {
            running = false;
        }
    }

    /**
     * Añade un comando a la cola de procesamiento. El comando será procesado
     * despues de que se procesen todos los comandos añadidos anteriormente.
     *
     * @param command comando a añadir a la cola de procesamiento. El tipo de
     * este párametro tiene que ser compatible con las funciones initFunc y
     * stepFunc pasadas en el constructor.
     */
    this.addCommand = function(command) {
        if (command == undefined)
            return;

        elements.push(command);

        if (!running) {
            running = true;
            doInit();
        }
    }
};
