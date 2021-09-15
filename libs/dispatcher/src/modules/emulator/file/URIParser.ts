import path = require('path');

function findScriptFilePath(basePath, options) {
  return path.join(basePath, options.fileName);
}

function findImageFilePath(basePath, options) {
  if (options.params && options.params.path) return path.join(basePath, options.params.path);
  else if (options.params && options.params.density)
    basePath = path.join(basePath, options.params.density);

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

function parseURI(uri: string) {
  let uriParts = /^(.*)\:\/\/(.*)/.exec(uri);
  if (!uriParts || uriParts.length < 3) return null;

  const parsedUri: any = {
    schema: uriParts[1],
  };

  if (uriParts[2].indexOf('?') > -1) {
    uriParts = /^(.*)\?(.*)/.exec(uriParts[2]);
    parsedUri.fileName = uriParts[1];

    if (uriParts[2].indexOf('=') > -1) {
      parsedUri.params = {};
      var optionsStr = uriParts[2].split('&');
      for (var i = 0; i < optionsStr.length; i++) {
        var parts = optionsStr[i].split('=');
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

export function parse(file: string, isIOS: boolean) {
  var parsedUri = parseURI(file);
  var schema = parsedUri.schema;
  var fileName = parsedUri.fileName;
  var result;

  switch (true) {
    case schema === 'font':
    case isIOS && schema === 'image':
      fileName = path.basename(fileName);
      result = {
        fileName: fileName,
        fileNameWithSchema: schema + '://' + fileName,
      };
      break;
    default:
      result = {
        fileName: fileName,
        fileNameWithSchema: file,
      };
  }

  return result;
}

export function findFilePath(basePaths, file) {
  var parsedUri = parseURI(file);
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
  }
}

export function generateURI(parsedUri) {
  return parsedUri.schema + '://' + parsedUri.fileName;
}
