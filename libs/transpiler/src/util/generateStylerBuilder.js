const fs = require("fs-extra");
const path = require("path");

const util = require("../util");
const DEFAULT_PATHS = require("../config").DEFAULT_PATHS;



function generateStylerBuilder(libraryUiFolder, initialization) {
  return Promise.resolve('Ignored');
  var stylerBuilderDestFilePath = path.join(libraryUiFolder, "styler-builder.js");
  return util
    .isExistsFileDir(stylerBuilderDestFilePath)
    .then(res => {
      if (!res.existing || initialization)
        x
    }, util.writeError);
}

module.exports = generateStylerBuilder;
