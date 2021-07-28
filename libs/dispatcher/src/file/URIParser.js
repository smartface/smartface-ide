const path = require('path');
const LogToConsole = require('../common/LogToConsole');

const {debug} = new LogToConsole(false, "URIParser");
function findScriptFilePath(basePath, options) {
  return path.join(basePath, options.fileName);
}

function findImageFilePath(basePath, options) {
  if (options.params && options.params.path) return path.join(basePath, options.params.path);
  if (options.params && options.params.density) basePath = path.join(basePath, options.params.density);

  return path.join(basePath, options.fileName);
}

function findAssetFilePath(basePath, options) {
  return path.join(basePath, options.fileName);
}

function findFontFilePath(basePath, options) {
  return path.join(basePath, options.fileName);
}

function findConfigFilePath(basePath, options) {
  return path.join(basePath, options.fileName);
}

function parseURI(uri) {
  let uriParts = /^(.*)\:\/\/(.*)/.exec(uri);
  if (!uriParts || uriParts.length < 3) return null;

  const parsedUri = {
    schema: uriParts[1]
  };

  if (uriParts[2].indexOf('?') > -1) {
    uriParts = /^(.*)\?(.*)/.exec(uriParts[2]);
    parsedUri.fileName = uriParts[1];

    if (uriParts[2].indexOf('=') > -1) {
      parsedUri.params = {};
      const optionsStr = uriParts[2].split('&');
      for (let i = 0; i < optionsStr.length; i++) {
        const parts = optionsStr[i].split('=');
        if (!parts || parts.length < 2) {
          parsedUri.params[parts[0]] = true;
        } else {
          parsedUri.params[parts[0]] = parts[1];
        }
      }
    }
  } else {
    parsedUri.fileName = uriParts[2];
  }

  return parsedUri;
}

function parse(file, isIOS) {
  const parsedUri = parseURI(file);
  const { schema } = parsedUri;
  let { fileName } = parsedUri;
  let result;

  switch (true) {
    case schema === 'font':
    case isIOS && schema === 'image':
      fileName = path.basename(fileName);
      result = {
        fileName,
        fileNameWithSchema: `${schema}://${fileName}`
      };
      break;
    default:
      result = {
        fileName,
        fileNameWithSchema: file
      };
  }

  return result;
}

function findFilePath(basePaths, file) {
  const parsedUri = parseURI(file);

  switch (parsedUri.schema) {
    case 'script':
      return findScriptFilePath(basePaths.scripts, parsedUri);
    case 'image':
      return findImageFilePath(basePaths.images, parsedUri);
    case 'asset':
      return findAssetFilePath(basePaths.assets, parsedUri);
    case 'font':
      return findFontFilePath(basePaths.fonts, parsedUri);
    case 'config':
      return findConfigFilePath(basePaths.config, parsedUri);
    default:
      break;
  }
}

function generateURI(parsedUri) {
  return `${parsedUri.schema}://${parsedUri.fileName}`;
}

module.exports = {
  parse,
  generateURI,
  findFilePath
};
