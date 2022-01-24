const fs = require("fs");
const path = require("path");

const series = require('async/series');
const queue = require('async/queue');

const mkdirp = require("../util/mkdirp").async;
const writeError = require("../utility").writeError;
const installOnePackage = require("./installOnePackage");

const CONCURRENCY = 5;

module.exports = (opt, _cb) => {
    var packageJSON, marketPlaceAssets = {};
    var installedPackages = {};
    const scriptsPackageJsonPath = path.join(opt.wsPath, "scripts", "package.json");
    const wsPackageJsonPath = path.join(opt.wsPath, "package.json");
    series({
        taskReadPackageJson: cb => {
            console.log("Reading packages info...");
            fs.readFile(wsPackageJsonPath, "utf-8", (err, data) => {
                if (err) return cb(err);
                try {
                    packageJSON = JSON.parse(data);
                    marketPlaceAssets = packageJSON["marketplace-assets"] || {};
                    cb();
                }
                catch (e) {
                    cb(e);
                }
            });
        },
        taskCreateTempFolder: cb => {
            mkdirp(opt.tempFolder).then(() => cb(), cb);
        },
        taskDownloadPackage: clb => {
            if (opt.name) {
                installOnePackage(opt, getInstallHandler(installedPackages, true, clb));
            }
            else {
                var isErr;
                var q = queue((name, cb) => {
                    installOnePackage(Object.assign({}, opt, {
                        name,
                        version: marketPlaceAssets[name]
                    }), getInstallHandler(installedPackages, true, cb));
                }, CONCURRENCY);
                // assign a callback
                q.drain = () => {
                    clb(isErr, "completed");
                };
                q.push(Object.keys(marketPlaceAssets) || [], err => {
                    isErr = err;
                });
            }
        },
        taskUpdatePackageJsonIfneeded: cb => {
            Object.assign(marketPlaceAssets, installedPackages);
            packageJSON["marketplace-assets"] = marketPlaceAssets;
            fs.writeFile(wsPackageJsonPath,
                JSON.stringify(packageJSON, null, "\t"),
                "utf-8",
                cb);
        },
    }, (err, res) => {
        !err && require("../client/child")({ task: "get_modules_components", broadcast: true }).then();
        if (_cb) {
            !err && console.log("package succesfully installed");
            return _cb(err, "package succesfully installed");
        }
        if (err)
            return writeError(err, "Install Error");
        setTimeout(() => {
            console.log("Successfully installed the following packages:");
            var keys = Object.keys(installedPackages);
            keys.forEach((packageName, index) => {
                console.log(`${ (index !== (keys.length-1)) ? "├──" : "└──"} ${packageName}@${installedPackages[packageName]} `);
            });
            console.log("");
        }, 1000);
    });
};

function getInstallHandler(results, isSave, cb) {
    return (err, asset) => {
        if (err) {
            return cb(err);
        }
        if (isSave) {
            results[asset.name] = asset.version;
        }
        cb();
    };
}
