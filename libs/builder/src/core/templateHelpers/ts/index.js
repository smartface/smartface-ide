const path = require('path');

const util = require('../../../util');
const getPath = require('../../../config').getPath;
const { REPEATED_VIEW, WITH_EXTEND, IRREGULAR_ENUMS } = require('../common');

function getRequiredIrregularEnums(smfObjects) {
  var mdls = {},
    res = [];

  if (arguments[1]) smfObjects = [arguments[1].data.root].concat(smfObjects || []);
  if (!smfObjects) return '';

  function searchAndSet(_smfObjects) {
    _smfObjects.forEach(item => {
      item.attributes && item.attributes.align && (mdls['ScrollViewAlign'] = true);
      item.html && (mdls['propFactory'] = true);
      item.html && (mdls['AttributedString'] = true);
      item.html && (mdls['createAttributedStrings'] = true);
      item.type === 'GridView' && (mdls['LayoutManager'] = true);
      REPEATED_VIEW[item.type] && (mdls['actionAddChild'] = true);
      item.smfObjects && searchAndSet(item.smfObjects);
    });
  }

  searchAndSet(smfObjects);

  for (var mdl in mdls) {
    if (IRREGULAR_ENUMS.require[mdl])
      res.push(`import ${mdl} = require('${IRREGULAR_ENUMS.require[mdl]}')`);
    else if (IRREGULAR_ENUMS.import[mdl]) {
      const currentImport = IRREGULAR_ENUMS.import[mdl];
      if (typeof currentImport === 'object' && !currentImport.defaultImport) {
        res.push(`import { ${mdl} } from '${currentImport.path}'`);
      }
      res.push(`import ${mdl} from '${currentImport}'`);
    }
  }
  return res.join('\n');
}

function getRequiredLibModules(smfObjects, isLib) {
  var res = [],
    requireLibdModules = {},
    requiredModules = {};
  if (!smfObjects) return '';

  function searchAndSet(_smfObjects) {
    _smfObjects.forEach(item => {
      item.isLibraryComponent && (requireLibdModules[item.libraryType] = true);
      item.isModuleComp && (requiredModules[item.moduleName] = item.modulePath);
      item.smfObjects && searchAndSet(item.smfObjects);
    });
  }

  searchAndSet(smfObjects);
  var libraryPath = path.relative(getPath('SCRIPTS_FOLDER'), getPath('LIBRARY_USER_FOLDER'));
  for (var mdl in requireLibdModules) {
    res.push(`import ${mdl} from '${libraryPath}/${mdl}';`);
  }

  for (var mdl in requiredModules) {
    res.push(`import ${mdl} = require('${requiredModules[mdl]}');`);
  }

  return res.join('\n');
}

module.exports = function(_compiler) {
  return {
    ...require('../common').getHelpers(_compiler),
    getRequiredIrregularEnums,
    getRequiredLibModules,
    removeFrom: (smfObjects, removes) => {
      return removes && removes.length
        ? smfObjects.filter(item => !removes.some(remove => item.type === remove))
        : smfObjects;
    }
  };
};
