"use strict";

var HTMLtoJSX = require("htmltojsx");
var JSXTransformer = require("react-tools");
var React = require("react");

var converter = new HTMLtoJSX({createClass: false});

var reactize = {

  version : REACTIZE_VERSION,

  reactize : function(element) {
    var code = JSXTransformer.transform(converter.convert(element.innerHTML));
    return eval(code);
  },

  applyDiffOnHTMLString : function(targetElement, htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString;
    Reactize.applyDiff(targetElement, div);
  },

  applyDiff : function(targetElement, replacementElement) {
    var bod = Reactize.reactize(replacementElement);
    React.render(bod, targetElement);
  },

  applyBodyDiff : function() {
    Reactize.applyDiff(document.body, document.body);
  }

};

global.Reactize = reactize;