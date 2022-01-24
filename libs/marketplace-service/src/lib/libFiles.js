const path = require("path");

const mkdirpSync = require("../util/mkdirp").sync;
const copyAssets = require("../lib/copyAssets");

module.exports.exportLibFiles = (opt, libComps) => {
    var destPath = path.join(opt.outputFolder, '.ui', 'library'),
        list = [];
    mkdirpSync(destPath);
    libComps.forEach(item => {
        list.push({
            src: path.join(opt.wsPath, '.ui', 'library', item + ".cpx"),
            relPath: opt.name + "_" + item + ".cpx",
            isRelPathFull: true
        });
    });
    return copyAssets(list, destPath, { no_target_folder: true });
};


module.exports.importLibFiles = (opt, libComps) => {

    var sourcePath = path.join(opt.packageFolder, '.ui', 'library'),
        destPath = path.join(opt.wsPath, '.ui', 'library'),
        list = [];
    libComps.forEach(item => {
        list.push({
            src: path.join(sourcePath, opt.name + "_" + item + ".cpx"),
            relPath: ""
        });
    });
    return copyAssets(list, destPath, {});
};
