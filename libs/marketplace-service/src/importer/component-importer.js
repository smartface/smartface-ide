const fs = require("fs");
const path = require("path");
const spawn = require("child_process").spawn;

const series = require('async/series');
const parallel = require('async/parallel');

const rmrf = require("../util/rmrf").async;
const importTheme = require("../lib/prepareThemes").importTheme;

const copyAssets = require("../lib/copyAssets");
const writeError = require("../utility.js").writeError;

module.exports = (opt, _cb) => {
    var _assetJSON;
    series({
        taskReadAssetJson: cb => {
            fs.readFile(path.join(opt.packageFolder, "asset.json"), "utf-8", (err, data) => {
                if (err) return cb(err);
                try {
                    _assetJSON = JSON.parse(data);
                }
                catch (e) {
                    return cb(e);
                }
                return cb();
            });
        },
        taskCopyAssets: cb => parallel({
                taskCopySource: cb => {
                    if(!opt.outputFolder) {
                        return cb();
                    }
                    copyAssets({
                                src: opt.packageFolder,
                                relPath: ""
                            },
                            path.join(opt.outputFolder, _assetJSON.name), {
                                no_target_folder: true
                            })
                        .then(res => {
                            cb();
                        }, cb);
                },
                taskCopyImages: cb => {
                    copyAssets({
                                src: path.join(opt.packageFolder, "images"),
                                relPath: ""
                            },
                            path.join(opt.imagesFolder), {
                                no_target_folder: true
                            })
                        .then(res => cb(), cb);
                },
                taskCopyFonts: cb => {
                    copyAssets({
                                src: path.join(opt.packageFolder, 'config', 'Fonts'),
                                relPath: ""
                            },
                            path.join(opt.fontsFolder), {
                                no_target_folder: true
                            })
                        .then(res => cb(), cb);
                },
                taskImportTheme: cb => {
                    importTheme(opt.settingsPath,
                            path.join(opt.packageFolder, _assetJSON.themePath || 'themes', 'theme.json'),
                            opt.themesFolder)
                        .then(() => cb(), cb);
                }
            },
            (err, res) => {
                if (cb)
                    return cb(err, res);
                if (err)
                    return writeError(err, "Library Importing Error");
            }),
        taskClean: cb => {
            let packageFolder = opt.packageFolder;
            if(opt.outputFolder) {
                packageFolder = path.join(opt.outputFolder, _assetJSON.name);
            }
            Promise.all(
                [
                    rmrf(path.join(packageFolder, "config")),
                    rmrf(path.join(packageFolder, "images")),
                    rmrf(path.join(packageFolder, "themes")),
                    rmrf(path.join(packageFolder, "preview")),
                    rmrf(path.join(packageFolder, "themes"))
                ]
            ).then(_res => cb(), cb);
        }
    }, (err, res) => {
        if (_cb)
            return _cb(err, res);
        if (err) {
            return writeError(err, "Library Importing Error");
        }
        console.log("Library importing succeed.");
    });
};


/* 
example command:
node modules-manager --task import --assetType library --packageFolder ~/workspace/workspace/.smf/modules/smflayouut --outputFolder /home/ubuntu/workspace/workspace/node_modules --wsPath ~/workspace/workspace
*/
