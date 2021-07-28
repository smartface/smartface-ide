const beautify = require('js-beautify').js_beautify;


module.exports = function(content) {

  return beautify(content, {
    "indent_size": 2,
    "indent-with-tabs": true,
    "wrap-line-length": 1,
    "no-preserve-newlines": true,
    "max_preserve_newlines": 2
  });

};
