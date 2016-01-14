(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["HTMLtoJSX"] = factory();
	else
		root["HTMLtoJSX"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/** @preserve
	 *  Copyright (c) 2014, Facebook, Inc.
	 *  All rights reserved.
	 *
	 *  This source code is licensed under the BSD-style license found in the
	 *  LICENSE file in the root directory of this source tree. An additional grant
	 *  of patent rights can be found in the PATENTS file in the same directory.
	 *
	 */
	'use strict';

	/**
	 * This is a very simple HTML to JSX converter. It turns out that browsers
	 * have good HTML parsers (who would have thought?) so we utilise this by
	 * inserting the HTML into a temporary DOM node, and then do a breadth-first
	 * traversal of the resulting DOM tree.
	 */

	// https://developer.mozilla.org/en-US/docs/Web/API/Node.nodeType
	var NODE_TYPE = {
	  ELEMENT: 1,
	  TEXT: 3,
	  COMMENT: 8
	};

	var ATTRIBUTE_MAPPING = {
	  'for': 'htmlFor',
	  'class': 'className'
	};

	var ELEMENT_ATTRIBUTE_MAPPING = {
	  'input': {
	    'checked': 'checked="true"',
	    'value': 'defaultValue'
	  }
	};

	var HTMLDOMPropertyConfig = __webpack_require__(1);

	// Populate property map with ReactJS's attribute and property mappings
	// TODO handle/use .Properties value eg: MUST_USE_PROPERTY is not HTML attr
	for (var propname in HTMLDOMPropertyConfig.Properties) {
	  if (!HTMLDOMPropertyConfig.Properties.hasOwnProperty(propname)) {
	    continue;
	  }

	  var mapFrom = HTMLDOMPropertyConfig.DOMAttributeNames[propname] || propname.toLowerCase();

	  if (!ATTRIBUTE_MAPPING[mapFrom])
	    ATTRIBUTE_MAPPING[mapFrom] = propname;
	}

	/**
	 * Repeats a string a certain number of times.
	 * Also: the future is bright and consists of native string repetition:
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
	 *
	 * @param {string} string  String to repeat
	 * @param {number} times   Number of times to repeat string. Integer.
	 * @see http://jsperf.com/string-repeater/2
	 */
	function repeatString(string, times) {
	  if (times === 1) {
	    return string;
	  }
	  if (times < 0) { throw new Error(); }
	  var repeated = '';
	  while (times) {
	    if (times & 1) {
	      repeated += string;
	    }
	    if (times >>= 1) {
	      string += string;
	    }
	  }
	  return repeated;
	}

	/**
	 * Determine if the string ends with the specified substring.
	 *
	 * @param {string} haystack String to search in
	 * @param {string} needle   String to search for
	 * @return {boolean}
	 */
	function endsWith(haystack, needle) {
	  return haystack.slice(-needle.length) === needle;
	}

	/**
	 * Trim the specified substring off the string. If the string does not end
	 * with the specified substring, this is a no-op.
	 *
	 * @param {string} haystack String to search in
	 * @param {string} needle   String to search for
	 * @return {string}
	 */
	function trimEnd(haystack, needle) {
	  return endsWith(haystack, needle)
	    ? haystack.slice(0, -needle.length)
	    : haystack;
	}

	/**
	 * Convert a hyphenated string to camelCase.
	 */
	function hyphenToCamelCase(string) {
	  return string.replace(/-(.)/g, function(match, chr) {
	    return chr.toUpperCase();
	  });
	}

	/**
	 * Determines if the specified string consists entirely of whitespace.
	 */
	function isEmpty(string) {
	   return !/[^\s]/.test(string);
	}

	/**
	 * Determines if the CSS value can be converted from a
	 * 'px' suffixed string to a numeric value
	 *
	 * @param {string} value CSS property value
	 * @return {boolean}
	 */
	function isConvertiblePixelValue(value) {
	  return /^\d+px$/.test(value);
	}

	/**
	 * Determines if the specified string consists entirely of numeric characters.
	 */
	function isNumeric(input) {
	  return input !== undefined
	    && input !== null
	    && (typeof input === 'number' || parseInt(input, 10) == input);
	}

	var createElement;
	if (true) {
	  // Browser environment, use document.createElement directly.
	  createElement = function(tag) {
	    return document.createElement(tag);
	  };
	} else {
	  // Node.js-like environment, use jsdom.
	  var jsdom = require('jsdom').jsdom;
	  var window = jsdom().defaultView;
	  createElement = function(tag) {
	    return window.document.createElement(tag);
	  };
	}

	var tempEl = createElement('div');
	/**
	 * Escapes special characters by converting them to their escaped equivalent
	 * (eg. "<" to "&lt;"). Only escapes characters that absolutely must be escaped.
	 *
	 * @param {string} value
	 * @return {string}
	 */
	function escapeSpecialChars(value) {
	  // Uses this One Weird Trick to escape text - Raw text inserted as textContent
	  // will have its escaped version in innerHTML.
	  tempEl.textContent = value;
	  return tempEl.innerHTML;
	}

	var HTMLtoJSX = function(config) {
	  this.config = config || {};

	  if (this.config.createClass === undefined) {
	    this.config.createClass = true;
	  }
	  if (!this.config.indent) {
	    this.config.indent = '  ';
	  }
	};
	HTMLtoJSX.prototype = {
	  /**
	   * Reset the internal state of the converter
	   */
	  reset: function() {
	    this.output = '';
	    this.level = 0;
	  },
	  /**
	   * Main entry point to the converter. Given the specified HTML, returns a
	   * JSX object representing it.
	   * @param {string} html HTML to convert
	   * @return {string} JSX
	   */
	  convert: function(html) {
	    this.reset();

	    var containerEl = createElement('div');
	    containerEl.innerHTML = '\n' + this._cleanInput(html) + '\n';

	    if (this.config.createClass) {
	      if (this.config.outputClassName) {
	        this.output = 'var ' + this.config.outputClassName + ' = React.createClass({\n';
	      } else {
	        this.output = 'React.createClass({\n';
	      }
	      this.output += this.config.indent + 'render: function() {' + "\n";
	      this.output += this.config.indent + this.config.indent + 'return (\n';
	    }

	    if (this._onlyOneTopLevel(containerEl)) {
	      // Only one top-level element, the component can return it directly
	      // No need to actually visit the container element
	      this._traverse(containerEl);
	    } else {
	      // More than one top-level element, need to wrap the whole thing in a
	      // container.
	      this.output += this.config.indent + this.config.indent + this.config.indent;
	      this.level++;
	      this._visit(containerEl);
	    }
	    this.output = this.output.trim() + '\n';
	    if (this.config.createClass) {
	      this.output += this.config.indent + this.config.indent + ');\n';
	      this.output += this.config.indent + '}\n';
	      this.output += '});';
	    }
	    return this.output;
	  },

	  /**
	   * Cleans up the specified HTML so it's in a format acceptable for
	   * converting.
	   *
	   * @param {string} html HTML to clean
	   * @return {string} Cleaned HTML
	   */
	  _cleanInput: function(html) {
	    // Remove unnecessary whitespace
	    html = html.trim();
	    // Ugly method to strip script tags. They can wreak havoc on the DOM nodes
	    // so let's not even put them in the DOM.
	    html = html.replace(/<script([\s\S]*?)<\/script>/g, '');
	    return html;
	  },

	  /**
	   * Determines if there's only one top-level node in the DOM tree. That is,
	   * all the HTML is wrapped by a single HTML tag.
	   *
	   * @param {DOMElement} containerEl Container element
	   * @return {boolean}
	   */
	  _onlyOneTopLevel: function(containerEl) {
	    // Only a single child element
	    if (
	      containerEl.childNodes.length === 1
	      && containerEl.childNodes[0].nodeType === NODE_TYPE.ELEMENT
	    ) {
	      return true;
	    }
	    // Only one element, and all other children are whitespace
	    var foundElement = false;
	    for (var i = 0, count = containerEl.childNodes.length; i < count; i++) {
	      var child = containerEl.childNodes[i];
	      if (child.nodeType === NODE_TYPE.ELEMENT) {
	        if (foundElement) {
	          // Encountered an element after already encountering another one
	          // Therefore, more than one element at root level
	          return false;
	        } else {
	          foundElement = true;
	        }
	      } else if (child.nodeType === NODE_TYPE.TEXT && !isEmpty(child.textContent)) {
	        // Contains text content
	        return false;
	      }
	    }
	    return true;
	  },

	  /**
	   * Gets a newline followed by the correct indentation for the current
	   * nesting level
	   *
	   * @return {string}
	   */
	  _getIndentedNewline: function() {
	    return '\n' + repeatString(this.config.indent, this.level + 2);
	  },

	  /**
	   * Handles processing the specified node
	   *
	   * @param {Node} node
	   */
	  _visit: function(node) {
	    this._beginVisit(node);
	    this._traverse(node);
	    this._endVisit(node);
	  },

	  /**
	   * Traverses all the children of the specified node
	   *
	   * @param {Node} node
	   */
	  _traverse: function(node) {
	    this.level++;
	    for (var i = 0, count = node.childNodes.length; i < count; i++) {
	      this._visit(node.childNodes[i]);
	    }
	    this.level--;
	  },

	  /**
	   * Handle pre-visit behaviour for the specified node.
	   *
	   * @param {Node} node
	   */
	  _beginVisit: function(node) {
	    switch (node.nodeType) {
	      case NODE_TYPE.ELEMENT:
	        this._beginVisitElement(node);
	        break;

	      case NODE_TYPE.TEXT:
	        this._visitText(node);
	        break;

	      case NODE_TYPE.COMMENT:
	        this._visitComment(node);
	        break;

	      default:
	        console.warn('Unrecognised node type: ' + node.nodeType);
	    }
	  },

	  /**
	   * Handles post-visit behaviour for the specified node.
	   *
	   * @param {Node} node
	   */
	  _endVisit: function(node) {
	    switch (node.nodeType) {
	      case NODE_TYPE.ELEMENT:
	        this._endVisitElement(node);
	        break;
	      // No ending tags required for these types
	      case NODE_TYPE.TEXT:
	      case NODE_TYPE.COMMENT:
	        break;
	    }
	  },

	  /**
	   * Handles pre-visit behaviour for the specified element node
	   *
	   * @param {DOMElement} node
	   */
	  _beginVisitElement: function(node) {
	    var tagName = node.tagName.toLowerCase();
	    var attributes = [];
	    for (var i = 0, count = node.attributes.length; i < count; i++) {
	      attributes.push(this._getElementAttribute(node, node.attributes[i]));
	    }

	    this.output += '<' + tagName;
	    if (attributes.length > 0) {
	      this.output += ' ' + attributes.join(' ');
	    }
	    if (node.firstChild) {
	      this.output += '>';
	    }
	  },

	  /**
	   * Handles post-visit behaviour for the specified element node
	   *
	   * @param {Node} node
	   */
	  _endVisitElement: function(node) {
	    // De-indent a bit
	    // TODO: It's inefficient to do it this way :/
	    this.output = trimEnd(this.output, this.config.indent);
	    if (node.firstChild) {
	      this.output += '</' + node.tagName.toLowerCase() + '>';
	    } else {
	      this.output += ' />';
	    }
	  },

	  /**
	   * Handles processing of the specified text node
	   *
	   * @param {TextNode} node
	   */
	  _visitText: function(node) {
	    var text = node.textContent;
	    // If there's a newline in the text, adjust the indent level
	    if (text.indexOf('\n') > -1) {
	      text = node.textContent.replace(/\n\s*/g, this._getIndentedNewline());
	    }
	    this.output += escapeSpecialChars(text);
	  },

	  /**
	   * Handles processing of the specified text node
	   *
	   * @param {Text} node
	   */
	  _visitComment: function(node) {
	    // Do not render the comment
	    // Since we remove comments, we also need to remove the next line break so we
	    // don't end up with extra whitespace after every comment
	    //if (node.nextSibling && node.nextSibling.nodeType === NODE_TYPE.TEXT) {
	    //  node.nextSibling.textContent = node.nextSibling.textContent.replace(/\n\s*/, '');
	    //}
	    this.output += '{/*' + node.textContent.replace('*/', '* /') + '*/}';
	  },

	  /**
	   * Gets a JSX formatted version of the specified attribute from the node
	   *
	   * @param {DOMElement} node
	   * @param {object}     attribute
	   * @return {string}
	   */
	  _getElementAttribute: function(node, attribute) {
	    switch (attribute.name) {
	      case 'style':
	        return this._getStyleAttribute(attribute.value);
	      default:
	        var tagName = node.tagName.toLowerCase();
	        var name =
	          (ELEMENT_ATTRIBUTE_MAPPING[tagName] &&
	            ELEMENT_ATTRIBUTE_MAPPING[tagName][attribute.name]) ||
	          ATTRIBUTE_MAPPING[attribute.name] ||
	          attribute.name;
	        var result = name;

	        // Numeric values should be output as {123} not "123"
	        if (isNumeric(attribute.value)) {
	          result += '={' + attribute.value + '}';
	        } else if (attribute.value.length > 0) {
	          result += '="' + attribute.value.replace('"', '&quot;') + '"';
	        }
	        return result;
	    }
	  },

	  /**
	   * Gets a JSX formatted version of the specified element styles
	   *
	   * @param {string} styles
	   * @return {string}
	   */
	  _getStyleAttribute: function(styles) {
	    var jsxStyles = new StyleParser(styles).toJSXString();
	    return 'style={{' + jsxStyles + '}}';
	  }
	};

	/**
	 * Handles parsing of inline styles
	 *
	 * @param {string} rawStyle Raw style attribute
	 * @constructor
	 */
	var StyleParser = function(rawStyle) {
	  this.parse(rawStyle);
	};
	StyleParser.prototype = {
	  /**
	   * Parse the specified inline style attribute value
	   * @param {string} rawStyle Raw style attribute
	   */
	  parse: function(rawStyle) {
	    this.styles = {};
	    rawStyle.split(';').forEach(function(style) {
	      style = style.trim();
	      var firstColon = style.indexOf(':');
	      var key = style.substr(0, firstColon);
	      var value = style.substr(firstColon + 1).trim();
	      if (key !== '') {
	        // Style key should be case insensitive
	        key = key.toLowerCase();
	        this.styles[key] = value;
	      }
	    }, this);
	  },

	  /**
	   * Convert the style information represented by this parser into a JSX
	   * string
	   *
	   * @return {string}
	   */
	  toJSXString: function() {
	    var output = [];
	    for (var key in this.styles) {
	      if (!this.styles.hasOwnProperty(key)) {
	        continue;
	      }
	      output.push(this.toJSXKey(key) + ': ' + this.toJSXValue(this.styles[key]));
	    }
	    return output.join(', ');
	  },

	  /**
	   * Convert the CSS style key to a JSX style key
	   *
	   * @param {string} key CSS style key
	   * @return {string} JSX style key
	   */
	  toJSXKey: function(key) {
	    // Don't capitalize -ms- prefix
	    if(/^-ms-/.test(key)) {
	      key = key.substr(1);
	    }
	    return hyphenToCamelCase(key);
	  },

	  /**
	   * Convert the CSS style value to a JSX style value
	   *
	   * @param {string} value CSS style value
	   * @return {string} JSX style value
	   */
	  toJSXValue: function(value) {
	    if (isNumeric(value)) {
	      // If numeric, no quotes
	      return value;
	    } else if (isConvertiblePixelValue(value)) {
	      // "500px" -> 500
	      return trimEnd(value, 'px');
	    } else {
	      // Probably a string, wrap it in quotes
	      return '\'' + value.replace(/'/g, '"') + '\'';
	    }
	  }
	};

	module.exports = HTMLtoJSX;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule HTMLDOMPropertyConfig
	 */

	/*jslint bitwise: true*/

	'use strict';

	var DOMProperty = __webpack_require__(2);
	var ExecutionEnvironment = __webpack_require__(3);

	var MUST_USE_ATTRIBUTE = DOMProperty.injection.MUST_USE_ATTRIBUTE;
	var MUST_USE_PROPERTY = DOMProperty.injection.MUST_USE_PROPERTY;
	var HAS_BOOLEAN_VALUE = DOMProperty.injection.HAS_BOOLEAN_VALUE;
	var HAS_SIDE_EFFECTS = DOMProperty.injection.HAS_SIDE_EFFECTS;
	var HAS_NUMERIC_VALUE = DOMProperty.injection.HAS_NUMERIC_VALUE;
	var HAS_POSITIVE_NUMERIC_VALUE =
	  DOMProperty.injection.HAS_POSITIVE_NUMERIC_VALUE;
	var HAS_OVERLOADED_BOOLEAN_VALUE =
	  DOMProperty.injection.HAS_OVERLOADED_BOOLEAN_VALUE;

	var hasSVG;
	if (ExecutionEnvironment.canUseDOM) {
	  var implementation = document.implementation;
	  hasSVG = (
	    implementation &&
	    implementation.hasFeature &&
	    implementation.hasFeature(
	      'http://www.w3.org/TR/SVG11/feature#BasicStructure',
	      '1.1'
	    )
	  );
	}


	var HTMLDOMPropertyConfig = {
	  isCustomAttribute: RegExp.prototype.test.bind(
	    /^(data|aria)-[a-z_][a-z\d_.\-]*$/
	  ),
	  Properties: {
	    /**
	     * Standard Properties
	     */
	    accept: null,
	    acceptCharset: null,
	    accessKey: null,
	    action: null,
	    allowFullScreen: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
	    allowTransparency: MUST_USE_ATTRIBUTE,
	    alt: null,
	    async: HAS_BOOLEAN_VALUE,
	    autoComplete: null,
	    // autoFocus is polyfilled/normalized by AutoFocusMixin
	    // autoFocus: HAS_BOOLEAN_VALUE,
	    autoPlay: HAS_BOOLEAN_VALUE,
	    cellPadding: null,
	    cellSpacing: null,
	    charSet: MUST_USE_ATTRIBUTE,
	    checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    classID: MUST_USE_ATTRIBUTE,
	    // To set className on SVG elements, it's necessary to use .setAttribute;
	    // this works on HTML elements too in all browsers except IE8. Conveniently,
	    // IE8 doesn't support SVG and so we can simply use the attribute in
	    // browsers that support SVG and the property in browsers that don't,
	    // regardless of whether the element is HTML or SVG.
	    className: hasSVG ? MUST_USE_ATTRIBUTE : MUST_USE_PROPERTY,
	    cols: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
	    colSpan: null,
	    content: null,
	    contentEditable: null,
	    contextMenu: MUST_USE_ATTRIBUTE,
	    controls: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    coords: null,
	    crossOrigin: null,
	    data: null, // For `<object />` acts as `src`.
	    dateTime: MUST_USE_ATTRIBUTE,
	    defer: HAS_BOOLEAN_VALUE,
	    dir: null,
	    disabled: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
	    download: HAS_OVERLOADED_BOOLEAN_VALUE,
	    draggable: null,
	    encType: null,
	    form: MUST_USE_ATTRIBUTE,
	    formAction: MUST_USE_ATTRIBUTE,
	    formEncType: MUST_USE_ATTRIBUTE,
	    formMethod: MUST_USE_ATTRIBUTE,
	    formNoValidate: HAS_BOOLEAN_VALUE,
	    formTarget: MUST_USE_ATTRIBUTE,
	    frameBorder: MUST_USE_ATTRIBUTE,
	    headers: null,
	    height: MUST_USE_ATTRIBUTE,
	    hidden: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
	    high: null,
	    href: null,
	    hrefLang: null,
	    htmlFor: null,
	    httpEquiv: null,
	    icon: null,
	    id: MUST_USE_PROPERTY,
	    label: null,
	    lang: null,
	    list: MUST_USE_ATTRIBUTE,
	    loop: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    low: null,
	    manifest: MUST_USE_ATTRIBUTE,
	    marginHeight: null,
	    marginWidth: null,
	    max: null,
	    maxLength: MUST_USE_ATTRIBUTE,
	    media: MUST_USE_ATTRIBUTE,
	    mediaGroup: null,
	    method: null,
	    min: null,
	    multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    muted: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    name: null,
	    noValidate: HAS_BOOLEAN_VALUE,
	    open: HAS_BOOLEAN_VALUE,
	    optimum: null,
	    pattern: null,
	    placeholder: null,
	    poster: null,
	    preload: null,
	    radioGroup: null,
	    readOnly: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    rel: null,
	    required: HAS_BOOLEAN_VALUE,
	    role: MUST_USE_ATTRIBUTE,
	    rows: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
	    rowSpan: null,
	    sandbox: null,
	    scope: null,
	    scoped: HAS_BOOLEAN_VALUE,
	    scrolling: null,
	    seamless: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
	    selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    shape: null,
	    size: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
	    sizes: MUST_USE_ATTRIBUTE,
	    span: HAS_POSITIVE_NUMERIC_VALUE,
	    spellCheck: null,
	    src: null,
	    srcDoc: MUST_USE_PROPERTY,
	    srcSet: MUST_USE_ATTRIBUTE,
	    start: HAS_NUMERIC_VALUE,
	    step: null,
	    style: null,
	    tabIndex: null,
	    target: null,
	    title: null,
	    type: null,
	    useMap: null,
	    value: MUST_USE_PROPERTY | HAS_SIDE_EFFECTS,
	    width: MUST_USE_ATTRIBUTE,
	    wmode: MUST_USE_ATTRIBUTE,

	    /**
	     * Non-standard Properties
	     */
	    // autoCapitalize and autoCorrect are supported in Mobile Safari for
	    // keyboard hints.
	    autoCapitalize: null,
	    autoCorrect: null,
	    // itemProp, itemScope, itemType are for
	    // Microdata support. See http://schema.org/docs/gs.html
	    itemProp: MUST_USE_ATTRIBUTE,
	    itemScope: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
	    itemType: MUST_USE_ATTRIBUTE,
	    // itemID and itemRef are for Microdata support as well but
	    // only specified in the the WHATWG spec document. See
	    // https://html.spec.whatwg.org/multipage/microdata.html#microdata-dom-api
	    itemID: MUST_USE_ATTRIBUTE,
	    itemRef: MUST_USE_ATTRIBUTE,
	    // property is supported for OpenGraph in meta tags.
	    property: null,
	    // IE-only attribute that controls focus behavior
	    unselectable: MUST_USE_ATTRIBUTE
	  },
	  DOMAttributeNames: {
	    acceptCharset: 'accept-charset',
	    className: 'class',
	    htmlFor: 'for',
	    httpEquiv: 'http-equiv'
	  },
	  DOMPropertyNames: {
	    autoCapitalize: 'autocapitalize',
	    autoComplete: 'autocomplete',
	    autoCorrect: 'autocorrect',
	    autoFocus: 'autofocus',
	    autoPlay: 'autoplay',
	    // `encoding` is equivalent to `enctype`, IE8 lacks an `enctype` setter.
	    // http://www.w3.org/TR/html5/forms.html#dom-fs-encoding
	    encType: 'encoding',
	    hrefLang: 'hreflang',
	    radioGroup: 'radiogroup',
	    spellCheck: 'spellcheck',
	    srcDoc: 'srcdoc',
	    srcSet: 'srcset'
	  }
	};

	module.exports = HTMLDOMPropertyConfig;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule DOMProperty
	 * @typechecks static-only
	 */

	/*jslint bitwise: true */

	'use strict';

	var invariant = __webpack_require__(4);

	function checkMask(value, bitmask) {
	  return (value & bitmask) === bitmask;
	}

	var DOMPropertyInjection = {
	  /**
	   * Mapping from normalized, camelcased property names to a configuration that
	   * specifies how the associated DOM property should be accessed or rendered.
	   */
	  MUST_USE_ATTRIBUTE: 0x1,
	  MUST_USE_PROPERTY: 0x2,
	  HAS_SIDE_EFFECTS: 0x4,
	  HAS_BOOLEAN_VALUE: 0x8,
	  HAS_NUMERIC_VALUE: 0x10,
	  HAS_POSITIVE_NUMERIC_VALUE: 0x20 | 0x10,
	  HAS_OVERLOADED_BOOLEAN_VALUE: 0x40,

	  /**
	   * Inject some specialized knowledge about the DOM. This takes a config object
	   * with the following properties:
	   *
	   * isCustomAttribute: function that given an attribute name will return true
	   * if it can be inserted into the DOM verbatim. Useful for data-* or aria-*
	   * attributes where it's impossible to enumerate all of the possible
	   * attribute names,
	   *
	   * Properties: object mapping DOM property name to one of the
	   * DOMPropertyInjection constants or null. If your attribute isn't in here,
	   * it won't get written to the DOM.
	   *
	   * DOMAttributeNames: object mapping React attribute name to the DOM
	   * attribute name. Attribute names not specified use the **lowercase**
	   * normalized name.
	   *
	   * DOMPropertyNames: similar to DOMAttributeNames but for DOM properties.
	   * Property names not specified use the normalized name.
	   *
	   * DOMMutationMethods: Properties that require special mutation methods. If
	   * `value` is undefined, the mutation method should unset the property.
	   *
	   * @param {object} domPropertyConfig the config as described above.
	   */
	  injectDOMPropertyConfig: function(domPropertyConfig) {
	    var Properties = domPropertyConfig.Properties || {};
	    var DOMAttributeNames = domPropertyConfig.DOMAttributeNames || {};
	    var DOMPropertyNames = domPropertyConfig.DOMPropertyNames || {};
	    var DOMMutationMethods = domPropertyConfig.DOMMutationMethods || {};

	    if (domPropertyConfig.isCustomAttribute) {
	      DOMProperty._isCustomAttributeFunctions.push(
	        domPropertyConfig.isCustomAttribute
	      );
	    }

	    for (var propName in Properties) {
	      ("production" !== process.env.NODE_ENV ? invariant(
	        !DOMProperty.isStandardName.hasOwnProperty(propName),
	        'injectDOMPropertyConfig(...): You\'re trying to inject DOM property ' +
	        '\'%s\' which has already been injected. You may be accidentally ' +
	        'injecting the same DOM property config twice, or you may be ' +
	        'injecting two configs that have conflicting property names.',
	        propName
	      ) : invariant(!DOMProperty.isStandardName.hasOwnProperty(propName)));

	      DOMProperty.isStandardName[propName] = true;

	      var lowerCased = propName.toLowerCase();
	      DOMProperty.getPossibleStandardName[lowerCased] = propName;

	      if (DOMAttributeNames.hasOwnProperty(propName)) {
	        var attributeName = DOMAttributeNames[propName];
	        DOMProperty.getPossibleStandardName[attributeName] = propName;
	        DOMProperty.getAttributeName[propName] = attributeName;
	      } else {
	        DOMProperty.getAttributeName[propName] = lowerCased;
	      }

	      DOMProperty.getPropertyName[propName] =
	        DOMPropertyNames.hasOwnProperty(propName) ?
	          DOMPropertyNames[propName] :
	          propName;

	      if (DOMMutationMethods.hasOwnProperty(propName)) {
	        DOMProperty.getMutationMethod[propName] = DOMMutationMethods[propName];
	      } else {
	        DOMProperty.getMutationMethod[propName] = null;
	      }

	      var propConfig = Properties[propName];
	      DOMProperty.mustUseAttribute[propName] =
	        checkMask(propConfig, DOMPropertyInjection.MUST_USE_ATTRIBUTE);
	      DOMProperty.mustUseProperty[propName] =
	        checkMask(propConfig, DOMPropertyInjection.MUST_USE_PROPERTY);
	      DOMProperty.hasSideEffects[propName] =
	        checkMask(propConfig, DOMPropertyInjection.HAS_SIDE_EFFECTS);
	      DOMProperty.hasBooleanValue[propName] =
	        checkMask(propConfig, DOMPropertyInjection.HAS_BOOLEAN_VALUE);
	      DOMProperty.hasNumericValue[propName] =
	        checkMask(propConfig, DOMPropertyInjection.HAS_NUMERIC_VALUE);
	      DOMProperty.hasPositiveNumericValue[propName] =
	        checkMask(propConfig, DOMPropertyInjection.HAS_POSITIVE_NUMERIC_VALUE);
	      DOMProperty.hasOverloadedBooleanValue[propName] =
	        checkMask(propConfig, DOMPropertyInjection.HAS_OVERLOADED_BOOLEAN_VALUE);

	      ("production" !== process.env.NODE_ENV ? invariant(
	        !DOMProperty.mustUseAttribute[propName] ||
	          !DOMProperty.mustUseProperty[propName],
	        'DOMProperty: Cannot require using both attribute and property: %s',
	        propName
	      ) : invariant(!DOMProperty.mustUseAttribute[propName] ||
	        !DOMProperty.mustUseProperty[propName]));
	      ("production" !== process.env.NODE_ENV ? invariant(
	        DOMProperty.mustUseProperty[propName] ||
	          !DOMProperty.hasSideEffects[propName],
	        'DOMProperty: Properties that have side effects must use property: %s',
	        propName
	      ) : invariant(DOMProperty.mustUseProperty[propName] ||
	        !DOMProperty.hasSideEffects[propName]));
	      ("production" !== process.env.NODE_ENV ? invariant(
	        !!DOMProperty.hasBooleanValue[propName] +
	          !!DOMProperty.hasNumericValue[propName] +
	          !!DOMProperty.hasOverloadedBooleanValue[propName] <= 1,
	        'DOMProperty: Value can be one of boolean, overloaded boolean, or ' +
	        'numeric value, but not a combination: %s',
	        propName
	      ) : invariant(!!DOMProperty.hasBooleanValue[propName] +
	        !!DOMProperty.hasNumericValue[propName] +
	        !!DOMProperty.hasOverloadedBooleanValue[propName] <= 1));
	    }
	  }
	};
	var defaultValueCache = {};

	/**
	 * DOMProperty exports lookup objects that can be used like functions:
	 *
	 *   > DOMProperty.isValid['id']
	 *   true
	 *   > DOMProperty.isValid['foobar']
	 *   undefined
	 *
	 * Although this may be confusing, it performs better in general.
	 *
	 * @see http://jsperf.com/key-exists
	 * @see http://jsperf.com/key-missing
	 */
	var DOMProperty = {

	  ID_ATTRIBUTE_NAME: 'data-reactid',

	  /**
	   * Checks whether a property name is a standard property.
	   * @type {Object}
	   */
	  isStandardName: {},

	  /**
	   * Mapping from lowercase property names to the properly cased version, used
	   * to warn in the case of missing properties.
	   * @type {Object}
	   */
	  getPossibleStandardName: {},

	  /**
	   * Mapping from normalized names to attribute names that differ. Attribute
	   * names are used when rendering markup or with `*Attribute()`.
	   * @type {Object}
	   */
	  getAttributeName: {},

	  /**
	   * Mapping from normalized names to properties on DOM node instances.
	   * (This includes properties that mutate due to external factors.)
	   * @type {Object}
	   */
	  getPropertyName: {},

	  /**
	   * Mapping from normalized names to mutation methods. This will only exist if
	   * mutation cannot be set simply by the property or `setAttribute()`.
	   * @type {Object}
	   */
	  getMutationMethod: {},

	  /**
	   * Whether the property must be accessed and mutated as an object property.
	   * @type {Object}
	   */
	  mustUseAttribute: {},

	  /**
	   * Whether the property must be accessed and mutated using `*Attribute()`.
	   * (This includes anything that fails `<propName> in <element>`.)
	   * @type {Object}
	   */
	  mustUseProperty: {},

	  /**
	   * Whether or not setting a value causes side effects such as triggering
	   * resources to be loaded or text selection changes. We must ensure that
	   * the value is only set if it has changed.
	   * @type {Object}
	   */
	  hasSideEffects: {},

	  /**
	   * Whether the property should be removed when set to a falsey value.
	   * @type {Object}
	   */
	  hasBooleanValue: {},

	  /**
	   * Whether the property must be numeric or parse as a
	   * numeric and should be removed when set to a falsey value.
	   * @type {Object}
	   */
	  hasNumericValue: {},

	  /**
	   * Whether the property must be positive numeric or parse as a positive
	   * numeric and should be removed when set to a falsey value.
	   * @type {Object}
	   */
	  hasPositiveNumericValue: {},

	  /**
	   * Whether the property can be used as a flag as well as with a value. Removed
	   * when strictly equal to false; present without a value when strictly equal
	   * to true; present with a value otherwise.
	   * @type {Object}
	   */
	  hasOverloadedBooleanValue: {},

	  /**
	   * All of the isCustomAttribute() functions that have been injected.
	   */
	  _isCustomAttributeFunctions: [],

	  /**
	   * Checks whether a property name is a custom attribute.
	   * @method
	   */
	  isCustomAttribute: function(attributeName) {
	    for (var i = 0; i < DOMProperty._isCustomAttributeFunctions.length; i++) {
	      var isCustomAttributeFn = DOMProperty._isCustomAttributeFunctions[i];
	      if (isCustomAttributeFn(attributeName)) {
	        return true;
	      }
	    }
	    return false;
	  },

	  /**
	   * Returns the default property value for a DOM property (i.e., not an
	   * attribute). Most default values are '' or false, but not all. Worse yet,
	   * some (in particular, `type`) vary depending on the type of element.
	   *
	   * TODO: Is it better to grab all the possible properties when creating an
	   * element to avoid having to create the same element twice?
	   */
	  getDefaultValueForProperty: function(nodeName, prop) {
	    var nodeDefaults = defaultValueCache[nodeName];
	    var testElement;
	    if (!nodeDefaults) {
	      defaultValueCache[nodeName] = nodeDefaults = {};
	    }
	    if (!(prop in nodeDefaults)) {
	      testElement = document.createElement(nodeName);
	      nodeDefaults[prop] = testElement[prop];
	    }
	    return nodeDefaults[prop];
	  },

	  injection: DOMPropertyInjection
	};

	module.exports = DOMProperty;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ExecutionEnvironment
	 */

	/*jslint evil: true */

	"use strict";

	var canUseDOM = !!(
	  (typeof window !== 'undefined' &&
	  window.document && window.document.createElement)
	);

	/**
	 * Simple, lightweight module assisting with the detection and context of
	 * Worker. Helps avoid circular dependencies and allows code to reason about
	 * whether or not they are in a Worker, even if they never include the main
	 * `ReactWorker` dependency.
	 */
	var ExecutionEnvironment = {

	  canUseDOM: canUseDOM,

	  canUseWorkers: typeof Worker !== 'undefined',

	  canUseEventListeners:
	    canUseDOM && !!(window.addEventListener || window.attachEvent),

	  canUseViewport: canUseDOM && !!window.screen,

	  isInWorker: !canUseDOM // For now, this is true - might change in the future.

	};

	module.exports = ExecutionEnvironment;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule invariant
	 */

	"use strict";

	/**
	 * Use invariant() to assert state which your program assumes to be true.
	 *
	 * Provide sprintf-style format (only %s is supported) and arguments
	 * to provide information about what broke and what you were
	 * expecting.
	 *
	 * The invariant message will be stripped in production, but the invariant
	 * will remain to ensure logic does not differ in production.
	 */

	var invariant = function(condition, format, a, b, c, d, e, f) {
	  if ("production" !== process.env.NODE_ENV) {
	    if (format === undefined) {
	      throw new Error('invariant requires an error message argument');
	    }
	  }

	  if (!condition) {
	    var error;
	    if (format === undefined) {
	      error = new Error(
	        'Minified exception occurred; use the non-minified dev environment ' +
	        'for the full error message and additional helpful warnings.'
	      );
	    } else {
	      var args = [a, b, c, d, e, f];
	      var argIndex = 0;
	      error = new Error(
	        'Invariant Violation: ' +
	        format.replace(/%s/g, function() { return args[argIndex++]; })
	      );
	    }

	    error.framesToPop = 1; // we don't care about invariant's own frame
	    throw error;
	  }
	};

	module.exports = invariant;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    draining = true;
	    var currentQueue;
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        var i = -1;
	        while (++i < len) {
	            currentQueue[i]();
	        }
	        len = queue.length;
	    }
	    draining = false;
	}
	process.nextTick = function (fun) {
	    queue.push(fun);
	    if (!draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	// TODO(shtylman)
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ }
/******/ ])
});
