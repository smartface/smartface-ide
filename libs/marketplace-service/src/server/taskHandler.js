const path = require("path");
const fs = require("fs");

const moment = require('moment');

const prepareErrorMsg = require("../utility").prepareErrorMsg;
const installer = require("../installer");
const uninstaller = require("../uninstaller");
const updater = require("../updater");
const service = require("../service");
const downloadFile = require("../lib/downloadFile");
const collectModuleComps = require("../lib/collectModuleComps");

module.exports = (opt, cb) => {
    switch (opt.data.task) {
        case "get_installed_packages":
            getInstalledPackages(opt, cb);
            break;
        case "install_package":
            installPackage(opt, cb);
            break;
        case "uninstall_package":
            uninstallPackage(opt, cb);
            break;
        case "update_package":
            updatePackage(opt, cb);
            break;
        case "download_file":
            downloadFileHandler(opt, cb);
            break;
        case "get_packages":
            getPackages(opt, cb);
            break;
        case "get_modules_components":
            getModulesComps(opt, cb);
            break;
        default:
            cb("invalid task: " + opt.data.task);
    }
};

function getInstalledPackages(opt, cb) {
    var result = {};
    fs.readFile(path.join(opt.wsPath, "package.json"), "utf-8", (err, data) => {
        if (!err) {
            try {
                result = JSON.parse(data)["marketplace-assets"];
                result = result ? Object.keys(result).map(key => {
                    return { name: key, version: result[key] };
                }) : [];
            }
            catch (e) {}
            cb(null, result || []);
        }
        else {
            cb(err);
        }
    });
}

function installPackage(opt, cb) {
    var data = opt.data || {};
    installer(Object.assign({}, opt, {
        name: data.name,
        version: data.version,
        token: data.token || opt.getToken(),
        ownerId: data.ownerId || opt.getOwnerId(),
        save: data.save,
        downloadUrl: null
    }), (err, result) => {
        cb(err, {
            message: err ? prepareErrorMsg(err) : result
        });
    });
}

function uninstallPackage(opt, cb) {
    var data = opt.data || {};
    uninstaller(Object.assign({}, opt, {
        name: data.name
    }), (err, result) => {
        cb(err, {
            message: err ? prepareErrorMsg(err) : result
        });
    });
}

function updatePackage(opt, cb) {
    var data = opt.data || {};
    updater(Object.assign({}, opt, {
        name: data.name,
        version: data.version,
        token: data.token || opt.getToken(),
        ownerId: data.ownerId || opt.getOwnerId(),
        save: data.save,
        downloadUrl: null
    }), (err, result) => {
        cb(err, {
            message: err ? prepareErrorMsg(err) : result
        });
    });
}


function downloadFileHandler(opt, cb) {
    var data = opt.data || {};
    downloadFile(data.url, path.join(opt.wsPath, data.dest), 12, function(err) {
        cb(err, {
            message: err ? prepareErrorMsg(err) : "file succesfully downloaded."
        });
    });
}

function getPackages(opt, cb) {
    var data = opt.data || {},
        tempItem;
    //console.dir(data);
    service.getAssets(data.ownerId || opt.getOwnerId(), data.token || opt.getToken()).then(res => {
        if (res.json instanceof Array) {
            res.json.forEach(item => {
                tempItem = moment.utc(item.publishedDate);
                item.publishedDate && tempItem.isValid() &&
                    (item.fromNow = tempItem.fromNow());
            });
        }
        cb(null, res.json);
    }, cb);
}

function getModulesComps(opt, cb) {
    collectModuleComps(path.join(opt.wsPath, "scripts", "node_modules"))
        .then(modules => cb(null, modules), cb);
}
