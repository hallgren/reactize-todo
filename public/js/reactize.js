/**
 * Reactize v0.4.1
 */
(function(exports) {
  var Reactize = {};

  var CLASS_NAME_REGEX = /\sclass=/g;
  var INPUT_TAG_REGEX = /\s(<input[^>]*)(>)/g;

  Reactize.reactize = function(element) {
    var code = JSXTransformer.transform(
      "/** @jsx React.DOM */" +
      this.htmlToJsx(element.innerHTML)).code;

    return eval(code);
  };

  Reactize.applyDiffOnHTMLString = function(current_element, html_string) {
    var div = document.createElement('div');
    div.innerHTML = html_string
    Reactize.applyDiff(current_element, div)
  };

  Reactize.applyDiff = function(current_element, new_element) {
    var bod = Reactize.reactize(new_element);
    React.render(bod, current_element);
  };

  Reactize.applyBodyDiff = function() {
    Reactize.applyDiff(document.body, document.body)
  };

  // Converts an HTML string into a JSX-compliant string.
  Reactize.htmlToJsx = function(html) {
    html = html.replace(CLASS_NAME_REGEX, " className=");
    return html.replace(INPUT_TAG_REGEX, "$1 /$2")
  };

  Reactize.version = "0.4.1";

  exports.Reactize = Reactize;
})(window);
