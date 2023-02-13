const fs = require('fs-extra');
const path = require('path');

const recursiveReaddir = require('recursive-readdir');

const MAX_TRY_COUNT = 40;
const CONSTANTS = require('../config').CONSTANTS;
const getSettings = require('../config').getSettings;
const getPath = require('../config').getPath;
const util = require('../util');
const generateStylerBuilder = require('../util/generateStylerBuilder');
const merge = require('@smartface/styler/lib/utils/merge');
const isExistsFileDir = util.isExistsFileDir;
const fileService = require('./fileService');
const ATTRIBUTES = require('../smfObject/attributes');
const { parseClassName, regexpOfParserClassName } = require('../util/parseClassNameHelper');
const dotProp = require('dot-prop');
var UNDEFINED_ATTRIBUTES_OBJECT = ATTRIBUTES.undefinedObject;

// const IGNORE_DEFAULTS = {
//     visible: true,
//     alpha: 1,
//     positionType: "RELATIVE",
//     alignSelf: "AUTO",
//     direction: "INHERIT",
//     flexWrap: "NOWRAP",
//     flexDirection: "COLUMN",
//     justifyContent: "FLEX_START",
//     "alignContent": "STRETCH",
//     "alignItems": "STRETCH",
//     touchEnabled: true,
//     borderColor: "rgba(0,0,0,1)",
//     borderWidth: 0,
// };

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

function createReplacerKeyValueMap(variables) {
  const resMap = new Map();
  Object.keys(variables).forEach(key => {
    const value = typeof variables[key] === 'string' ? `"${variables[key]}"` : variables[key];
    resMap.set(`"\${${key}}"`, value);
  });
  return resMap;
}

function createReplacerRegExp(variables) {
  const keyVars = Object.keys(variables)
    .map(key => escapeRegExp(`"\${${key}}"`))
    .join('|');
  return new RegExp(keyVars, 'mg');
}

function replaceVariablesWithValue(content, regExp, variableMap) {
  regExp.lastIndex = 0;
  return content.replace(regExp, matched => variableMap.get(matched));
}

module.exports = (function() {
  let _classesMap = {};
  let themeBundles = {};
  let generatingBundles = {};
  let isReadyForGenerationBundle = true;
  let isReadyForGenerationClassesMap = true;

  var themesFolder, themesDistFolder, libraryUiFolder;

  function initFolderPaths() {
    themesFolder = getPath('THEMES_FOLDER');
    themesDistFolder = getPath('THEMES_DIST_FOLDER');
    libraryUiFolder = getPath('LIBRARY_UI_FOLDER');
  }

  function generateStyles() {
    var promises = [];
    var taskCount = 0;

    return new Promise((resolve, reject) => {
      fs.readdir(themesFolder, (err, files) => {
        if (err) return reject(err);
        util.mkdirpSync(themesDistFolder);
        var defaultsTheme = CONSTANTS.defaultsTheme;
        var workspaceTheme = getSettings().config.theme.baseTheme || CONSTANTS.workspaceTheme;
        var defaultThemePath = path.join(themesFolder, defaultsTheme);
        var workspaceThemePath = path.join(themesFolder, workspaceTheme);
        files = files.filter(f => f !== defaultsTheme && f !== workspaceTheme);
        taskCount += files.length;
        themeBundles = {}; // reset bundles.
        generatingBundles = {};
        generateOneTheme(defaultThemePath) // generate defaultBundle
          .then(defaultThemeDist => {
            return generateOneTheme(workspaceThemePath, defaultsTheme); // generate worksapceBundle
          }, reject)
          .then(workspaceThemeDist => {
            files.length
              ? files.forEach((file, index) => {
                  isExistsFileDir(path.join(themesFolder, file)).then(res => {
                    if (res.dir) {
                      // generate others
                      promises.push(
                        generateOneTheme(path.join(themesFolder, file), workspaceTheme)
                      );
                    }
                    done();
                  }, reject);
                })
              : done();
          }, reject);
      });

      generateStylerBuilder(libraryUiFolder).then(res => res);

      function done(err) {
        if (err) return reject(err);
        if (--taskCount <= 0) {
          Promise.all(promises).then(resolve, reject);
        }
      }
    });
  }

  function generateOneTheme(themeDir, defaultParentTheme) {
    return new Promise((resolve, reject) => {
      let styles = [];
      let indexJSON = {};
      let themeName = path.basename(themeDir);

      generatingBundles[themeName] = true;
      recursiveReaddir(path.join(themeDir, 'styles')).then(_files => {
        const files = _files.filter(util.isStyleDesignFile);
        try {
          indexJSON = fs.readJsonSync(path.join(themeDir, 'index.json')) || {};
        } catch (exp) {
          exp.file = path.join(themeDir, 'index.json');
          util.writeError(exp, 'Index.json error');
        }
        files.forEach((file, index) => {
          try {
            styles.push(fs.readJsonSync(file));
          } catch (e) {
            e.file = file;
            util.writeError(e, 'Style JSON Parse Error');
          }
        });
        let bundle = merge.apply(null, styles);
        Object.keys(bundle)
          .filter(key => regexpOfParserClassName.test(key))
          .forEach(key => {
            const parsedKey = parseClassName(key);
            dotProp.set(bundle, parsedKey, bundle[key]);
            delete bundle[key];
          });
        let parentTheme = indexJSON.parent || defaultParentTheme;
        getThemePack(path.dirname(themeDir), parentTheme, defaultParentTheme).then(
          parentThemePack => {
            let variablesJson = {};

            try {
              variablesJson = fs.readJsonSync(path.join(themeDir, 'variables.json')) || {};
            } catch (e) {}
            if (parentThemePack) {
              //console.time('Merge:' + themeName);
              bundle = merge(parentThemePack.bundle, bundle);
              //console.timeEnd('Merge:' + themeName);
              variablesJson = Object.assign(parentThemePack.variables, variablesJson);
            }
            const bundleString = JSON.stringify(bundle);
            let content = bundleString;
            eliminateAttributesFromStyle(bundle, !defaultParentTheme);
            if (Object.keys(variablesJson).length) {
              const varReplacerRegExp = createReplacerRegExp(variablesJson);
              const varsKeyValueMap = createReplacerKeyValueMap(variablesJson);
              content = replaceVariablesWithValue(bundleString, varReplacerRegExp, varsKeyValueMap);
            }
            //bundle = merge(bundle, _classesMap); //merge classnames to bundle
            const file = path.join(themesDistFolder, themeName + '.json');
            fileService.writeFile(file, content, 'utf8', err => {
              if (err) return reject(err);
              themeBundles[themeName] = { bundle, variables: variablesJson };
              resolve(themeBundles[themeName]);
              const parentThemeStr = parentTheme || '';
              const repeatLen = 25 - parentThemeStr.length;
              console.log(
                `├─ 📦  Generated Bundle ➪  ${'—'.repeat(
                  repeatLen / 2
                )} ${parentThemeStr} ${'—'.repeat(repeatLen / 2)}➞ ${themeName}`
              );
            });
          },
          reject
        );
      }, reject);
    });
  }

  function getThemePack(themesFolder, theme, defaultParentTheme, _count) {
    return new Promise((resolve, reject) => {
      if (!theme) return resolve(null);
      if (themeBundles[theme]) {
        resolve(themeBundles[theme]);
      } else if (generatingBundles[theme]) {
        if (_count >= MAX_TRY_COUNT)
          return reject(new Error('Maximum call stack size exceeded ->' + MAX_TRY_COUNT));
        setTimeout(e => {
          getThemePack(themesFolder, theme, defaultParentTheme, _count ? _count + 1 : 2).then(
            resolve,
            reject
          );
        }, 200);
      } else {
        generateOneTheme(path.join(themesFolder, theme), defaultParentTheme).then(resolve, reject);
      }
    });
  }
  return {
    generateStyles: generateStyles,
    initFolderPaths: initFolderPaths
  };
})();

function eliminateAttributesFromStyle(styleObj, isDefault) {
  var isDelete = false,
    keys;
  var deleted = 0;
  if (styleObj && typeof styleObj === 'object') {
    keys = Object.keys(styleObj);
    if (keys.length) {
      keys.forEach(key => {
        if (eliminateAttributesFromStyle(styleObj[key], isDefault)) {
          delete styleObj[key];
        }
      });
      if (keys.length - deleted === 0) {
        isDelete = true;
      } else {
        Object.assign(styleObj, UNDEFINED_ATTRIBUTES_OBJECT);
      }
    } else {
      isDelete = true;
    }
  }
  return isDelete;
}
