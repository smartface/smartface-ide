const HTML = require('html-parse-stringify')

var lastTextNode = null;

function getAttributedStrings(htmlSource) {
  htmlSource = `<span>${htmlSource}</span>`;
  var ast = HTML.parse(htmlSource.replace(/<br>/gmi, "\n"));
  var tree = getParsedTree(ast[0]);
  lastTextNode = null;
  return getAttributedStringsFromTree(tree);
}

function getParsedTree(ast, parent) {
  var res = { children: [] };
  if (!ast)
    return res;

  res.style = Object.assign({}, parent && parent.style ? parent.style : {}, ast.attrs && ast.attrs.style ? getParsedStyleObject(ast.attrs.style) : {});

  if (ast.attrs && ast.attrs.color)
    res.style.color = ast.attrs.color;
  if (ast.type === "text") {
    res.value = ast.content;
    lastTextNode = res;
  }
  else if (ast.type == "tag" && (ast.name == "br" || ast.name == "div")) {
    lastTextNode && (lastTextNode.value += "\n");
  }
  else if (ast.type == "tag" && ast.name == "u") {

    res.style["text-decoration-line"] = "underline";
  }
  if (ast.voidElement === false) {
    ast.children.forEach(c => res.children.push(getParsedTree(c, res)));
  }
  return res;
}

function getParsedStyleObject(style) {
  var res = {};
  var styles = style.split(";");
  styles.forEach(item => {
    var oneStyle = item.trim().split(": ");
    oneStyle.length === 2 && (res[oneStyle[0]] = oneStyle[1]);
  });
  return res;
}

function getAttributedStringsFromTree(tree, resStrings) {
  resStrings = resStrings || [];

  var obj = { font: {} };

  if (tree.value) {
    if (tree.style["font-family"]) {
      var parsedFamily = tree.style["font-family"].split(/_|-/);
      parsedFamily.length === 3 && parsedFamily.shift();
      parsedFamily[0] && (Object.assign(obj, {
        font: {
          family: parsedFamily[0]
        }
      }));
      if(parsedFamily[1]) {
        obj.font.style = parsedFamily[1];
        obj.font.bold = /bold/i.test(obj.font.style);
        obj.font.italic = /italic/i.test(obj.font.style);
      }
    }
    tree.style["font-size"] && (obj.font.size = Math.floor(parseFloat(tree.style["font-size"])));
    tree.style["font-weight"] && (obj.font.bold = true);
    tree.style["font-style"] && (obj.font.italic = true);
    tree.style["background-color"] && (obj.backgroundColor = tree.style["background-color"]);
    tree.style["color"] && (obj.foregroundColor = tree.style["color"]);
    tree.style["text-decoration-line"] && (obj.underline = true);
    tree.style["text-decoration-color"] && (obj.underlineColor = tree.style["text-decoration-color"]);
    obj.string = tree.value;
    Object.keys(obj.font).length === 0 && (delete obj.font);
    if (resStrings.length && isEaualProps(resStrings[resStrings.length - 1], obj)) {
      resStrings[resStrings.length - 1].string += obj.string;
    }
    else
      resStrings.push(obj);
  }
  tree.children.forEach(t => {
    getAttributedStringsFromTree(t, resStrings);
  });
  return resStrings;
}

function isEaualProps(a, b) {
  return (
    a.underline === b.underline &&
    a.backgroundColor === b.backgroundColor &&
    a.foregroundColor === b.foregroundColor &&
    isEqualFontProps(a.font, b.font) && (
    (a.ios && a.ios) ? (a.ios.underlineColor === b.ios.underlineColor) :
    (!a.ios && !b.ios) ? true : false )
  );
}

function isEqualFontProps(a, b) {
  if (a && b) {
    return (
      a.bold === b.bold &&
      a.italic === b.italic &&
      a.style === b.style &&
      a.family === b.family &&
      a.size === b.size
    );
  }
  else if (!a && !b)
    return true;
  return false;
}

module.exports = getAttributedStrings;