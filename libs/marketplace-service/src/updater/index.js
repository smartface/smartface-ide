const fs = require("fs");
const path = require("path");

const series = require('async/series');

const installer = require("../installer");
const uninstaller = require("../uninstaller");

const writeError = require("../utility").writeError;


module.exports = (opt, _cb) => {
    series({
        taskUninstall: cb => {
            uninstaller(opt, cb);
        },
        taskInstall: cb => {
            installer(opt, cb);
        }
    }, (err, res) => {
        if (_cb) {
            !err && console.log("package succesfully updated");
            return _cb(err, "package succesfully updated");
        }
        if (err)
            return writeError(err, "Update Error");
        console.log("package succesfully updated");
    });
};
