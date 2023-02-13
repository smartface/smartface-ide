function parseClassName(className) {
  var regexpOfClassName = /([a-zA-Z\d]+)(-|_|\.){0,1}/g;
  var res = [],
    lastElement,
    secondLastElement,
    result = regexpOfClassName.exec(className);

  while (result) {
    lastElement = {
      name: result[1],
      delim: result[2]
    };
    res.push(lastElement);
    secondLastElement = res[res.length - 2];

    if (secondLastElement) {
      lastElement.name =
        (secondLastElement.delim !== '.' ? '&' : '\\') + secondLastElement.delim + lastElement.name;
    }
    result = regexpOfClassName.exec(className);
  }
  res[0] && (res[0].name = className.charAt(0).replace('.', '\\.') + res[0].name);
  return res.map(item => item.name).join('.');
}

const regexpOfParserClassName = /([a-zA-Z\d]+)(-|_|\.){1}([a-zA-Z\d]+)$/;

module.exports = {
  parseClassName,
  regexpOfParserClassName
};
