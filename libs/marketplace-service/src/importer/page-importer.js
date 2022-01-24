const fs = require("fs");
const path = require("path");

const series = require('async/series');
const parallel = require('async/parallel');

const copyAssets = require("../lib/copyAssets");
const writeError = require("../utility.js").writeError;

module.exports = (opt, cb) => {
    var _packageName, __assetJSON;
    series({
        taskEmpty: cb => {
            fs.readFile(path.join(opt.packageFolder, "asset.json"), "utf-8", (err, data) => {
                if (err) return cb(err);
                try {
                    __assetJSON = JSON.parse(data);
                    _packageName = __assetJSON.name;
                    cb();
                }
                catch (e) { cb(e) }
            });
        },
        taskWriteInstalledDate: cb => {
            __assetJSON.installedDate = new Date().toUTCString();
            fs.writeFile(
                path.join(opt.packageFolder, "asset.json"),
                JSON.stringify(__assetJSON, null, "\t"),
                cb);
        }
    }, (err, res) => {
        if (err)
            return writeError(err, "Page Importing Error");
        parallel({
            taskCopyPackage: cb => {
                copyAssets({
                            src: opt.packageFolder,
                            relPath: "",
                            isDir: true
                        },
                        path.join(opt.outputFolder, opt.name || _packageName), {
                            no_target_folder: true
                        })
                    .then(res => cb(), cb);
            }
        }, (err, res) => {
            if (cb)
                return cb(err, res);
            if (err)
                return writeError(err, "Page Importing Error");
            console.log("Page importing succeed.");
        });
    });
};

/*
node modules-manager --task import --assetType template --packageFolder ~/workspace/workspace/.templates/page2plate --outputFolder /home/ubuntu/workspace/workspace/.templates/mdlPage2
*/
