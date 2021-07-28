const path = require("path");

const util = require("../../../util");
const getPath = require("../../../config").getPath;
const { REPEATED_VIEW, WITH_EXTEND, IRREGULAR_ENUMS } = require('../common');

function getRequiredIrregularEnums(smfObjects) {
  var mdls = {},
    res = [];

  if (arguments[1])
    smfObjects = [arguments[1].data.root].concat(smfObjects || []);
  if (!smfObjects)
    return "";

  function searchAndSet(_smfObjects) {
    _smfObjects.forEach(item => {
      item.attributes && item.attributes.align && (mdls["ScrollViewAlign"] = true);
      item.html && (mdls["propFactory"] = true);
      item.html && (mdls["AttributedString"] = true);
      item.html && (mdls["createAttributedStrings"] = true);
      item.type === "GridView" && (mdls["LayoutManager"] = true);
      REPEATED_VIEW[item.type] && (mdls["actionAddChild"] = true);
      item.smfObjects && (searchAndSet(item.smfObjects));
    });
  }

  searchAndSet(smfObjects);

  for (var mdl in mdls) {
    res.push(`const ${mdl} = ${WITH_EXTEND[mdl] ? "extend(" : ""}require("${IRREGULAR_ENUMS[mdl]}")${WITH_EXTEND[mdl] ? ")" : ""};`);
  }
  return res.join("\n");
}

function getRequiredLibModules(smfObjects, isLib) {
  var res = [],
    requireLibdModules = {},
    requiredModules = {};
  if (!smfObjects)
    return "";

  function searchAndSet(_smfObjects) {
    _smfObjects.forEach(item => {
      item.isLibraryComponent && (requireLibdModules[item.libraryType] = true);
      item.isModuleComp && (requiredModules[item.moduleName] = item.modulePath);
      item.smfObjects && (searchAndSet(item.smfObjects));
    });
  }

  searchAndSet(smfObjects);
  var libraryPath = path.relative(getPath("SCRIPTS_FOLDER"), getPath("LIBRARY_USER_FOLDER"));
  for (var mdl in requireLibdModules) {
    res.push(`const ${mdl} = extend(require("${libraryPath}/${mdl}"));`);
  }

  for (var mdl in requiredModules) {
    res.push(`const ${mdl} = extend(require("${requiredModules[mdl]}"));`);
  }

  return res.join("\n");
}

module.exports = function(_compiler) {
  return {
    ...require('../common').getHelpers(_compiler),
    getRequiredIrregularEnums,
    getRequiredLibModules
  };
};
