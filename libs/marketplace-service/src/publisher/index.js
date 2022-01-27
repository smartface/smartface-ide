const fs = require("fs");
const path = require("path");

const series = require('async/series');

const zip = require("../util/zip").async;
const rmrf = require("../util/rmrf").async;

const writeError = require("../utility").writeError;
const getRandomName = require("../utility").getRandomName;
const getUploadOptions = require("../service").getUploadOptions;
const uploader = require("../lib/uploader");


module.exports = opt => {
    var _assetJSON;
    const tempPackeZipPath = path.join(opt.tempFolder, `package${getRandomName()}.zip`);
    if (!opt.ownerId)
        return writeError("ownerId cannot be null. You should refresh ide for new token", "Authorization Error");
    series({
        taskReadAssetJson: cb => {
            console.log("Reading the package info...");
            fs.readFile(path.join(opt.packageFolder, "asset.json"), "utf-8", (err, data) => {
                if (err) return cb(err);
                try {
                    _assetJSON = JSON.parse(data);
                    cb();
                }
                catch (e) {
                    cb(e);
                }
            });
        },
        taskUpdateAssetJson: cb => {
            return cb();
        },
        taskSetIcon: cb => {
            if (_assetJSON.type !== "library" || !_assetJSON.iconPath)
                return cb(null);
            fs.readFile(path.join(opt.packageFolder, _assetJSON.iconPath), "utf-8",
                (err, svgSource) => {
                    if (err)
                        return cb(err);
                    fs.readFile(path.join(opt.packageFolder, "view.json"), "utf-8",
                        (err, _data) => {
                            if (err)
                                return cb(err);
                            var viewJson = JSON.parse(_data);
                            viewJson.components[0].source.moduleIcon = svgSource;
                            fs.writeFile(path.join(opt.packageFolder, "view.json"),
                                JSON.stringify(viewJson, null, "\t"), "utf-8", cb);
                        });
                });
        },
        taskCreateZip: cb => {
            console.log("Creating the package archive...");
            zip(opt.packageFolder, tempPackeZipPath).then(res => cb(null, res), cb);
        },
        taskUpload: cb => {
            console.log("Uploading the package...");
            uploader([tempPackeZipPath, {
                key: "isPrivate",
                value: JSON.stringify(opt.access === "private")
            }], getUploadOptions(opt.ownerId, opt.token), cb);
        }
    }, (err) => {
        rmrf(tempPackeZipPath).then(() => {});
        if (err)
            return writeError(err, "Publish Error");
        setTimeout(() => {
            console.log("Package publish succesfully.");
        }, 1000);
    });
};
