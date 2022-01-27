const fs = require("fs");
const path = require("path");

const parallel = require('async/parallel');
const series = require('async/series');

const removeTheme = require("../lib/prepareThemes").removeTheme;
const getJson = require("../lib/getJson");
const rmrf = require("../util/rmrf").async;
const writeError = require("../utility").writeError;

module.exports = (opt, _cb) => {
    var __assetJson;
    series({
        taskGetPageAssetJSon: cb => {
            getJson(path.join(opt.wsPath, ".templates", opt.name, "asset.json"))
                .then(json => cb(null, __assetJson = json), () => cb());
        },
        taskGetLibAssetJSon: cb => {
            !__assetJson ? getJson(
                    path.join(opt.wsPath, 'scripts', 'node_modules', opt.name, "asset.json"))
                .then(json => cb(null, __assetJson = json), () => cb()) : cb();
        },
        taskSetAssetJSon: cb => {
            __assetJson = __assetJson || {};
            cb();
        }
    }, (err, res) => {
        if (err)
            return _cb(err);
        parallel({
            taskRemoveTemplate: cb => {
                __assetJson.type === "page" ?
                    rmrf(path.join(opt.wsPath, ".templates", opt.name))
                    .then(() => cb(), cb) : cb();
            },
            taskRemoveLibrary: cb => {
                __assetJson.type === "library" ?
                    Promise.all([
                        rmrf(path.join(opt.wsPath, 'scripts', 'node_modules', opt.name)),
                    ])
                    .then(() => cb(), cb) : cb();
            },
            taskRemoveTheme: cb => {
                __assetJson.themePath ?
                    removeTheme(
                        opt.settingsPath,
                        opt.themesFolder,
                        path.basename(__assetJson.themePath))
                    .then(() => cb(), cb) : cb();
            },
            taskUpdateWsJson: cb => {
                getJson(path.join(opt.wsPath, "package.json"))
                    .then(json => {
                        delete json["marketplace-assets"][opt.name];
                        fs.writeFile(
                            path.join(opt.wsPath, "package.json"),
                            JSON.stringify(json, null, "\t"),
                            "utf-8",
                            cb);
                    }, cb);
            }
        }, (err, res) => {
            !err && require("../client/child")({ task: "get_modules_components", broadcast: true }).then();
            if (_cb) {
                !err && console.log("package succesfully uninstalled");
                return _cb(err, "package succesfully uninstalled");
            }
            if (err)
                return writeError(err, "Uninstall Error");
            console.log("package succesfully uninstalled")
        });
    });
};
