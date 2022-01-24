const path = require("path");
const fs = require("fs");

const series = require('async/series');

const unzip = require("../util/unzip").async;
const rmrf = require("../util/rmrf").async;

const writeError = require("../utility").writeError;
const getRandomName = require("../utility").getRandomName;
const downloadFile = require("../lib/downloadFile");
const getPackageInfo = require("../service").getPackageInfo;
const incrementInstallCount = require("../service").incrementInstallCount;
const importer = require("../importer");

const IMPORT_FOLDERS = {
    "library": path.join('scripts', 'node_modules'),
    "page": ".templates"
};

module.exports = (opt, _cb) => {
    var __downloadUrl = opt.downloadUrl;
    var __assetJson;
    var tempPackagePath = path.join(opt.tempFolder, "package" + getRandomName() + ".zip");
    var tempPackageFolderPath = tempPackagePath.replace(".zip", "");
    series({
        taskGetDownloadUrl: cb => {
            if (__downloadUrl)
                return cb();
            console.log("Fetching the package ", opt.name, "...");
            getPackageInfo(opt.name, opt.version, opt.ownerId, opt.token)
                .then(res => {
                    __assetJson = res.json;
                    __downloadUrl = res.json.downloadUrl;
                    cb();
                }, err => {
                    cb(err || { err: "Server Error", msg: "try again." });
                });
        },
        taskDownloadPackage: cb => {
            downloadFile(__downloadUrl, tempPackagePath, 10, cb, __assetJson && __assetJson.name);
        },
        taskUnzipPackage: cb => {
            console.log("Unpacking package...");
            unzip(tempPackagePath, tempPackageFolderPath).then(() => cb(), cb);
        },
        taskReadAssetJson: cb => {
            console.log("Reading package info…");
            if (__assetJson)
                return cb();
            try {
                __assetJson = JSON.parse(fs.readFileSync(path.join(tempPackageFolderPath, "asset.json"), "utf-8"));
                return cb();
            }
            catch (e) { return cb(e) }
        },
        taskImportPackage: cb => {
            console.log("Importing package...");
            if (!IMPORT_FOLDERS[__assetJson.type])
                return cb("invalid type ! -> " + __assetJson.type);
            importer(__assetJson.type, Object.assign({}, opt, {
                outputFolder: path.join(opt.wsPath, IMPORT_FOLDERS[__assetJson.type]),
                packageFolder: tempPackageFolderPath
            }), cb);
        },
        taskCleanTemps: cb => {
            console.log("Cleaning temporary files...");
            rmrf(`${opt.tempFolder}/${path.basename(tempPackageFolderPath)}`)
                .then(res => res, cb);
            rmrf(`${opt.tempFolder}/${path.basename(tempPackagePath)}`)
                .then(() => cb(), cb);
        },
        taskIncrementInstallCount: cb => {
            //console.log("package increment install count...");
            incrementInstallCount(__assetJson.name, __assetJson.version, opt.ownerId, opt.token)
                .then(() => cb(), cb);
        }
    }, (err, res) => {
        if (err) return _cb(err);
        _cb(null, {
            name: __assetJson.name,
            version: __assetJson.version
        });
    });
};
