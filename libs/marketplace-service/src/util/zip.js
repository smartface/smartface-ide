const { execSync, exec } = require('child_process');
const path = require("path");

module.exports.sync = (sourceFolder, destZipPath) => {
    return execSync(`mkdir -p ${path.dirname(destZipPath)} && zip -r ${destZipPath} .`, {
            cwd: sourceFolder
        });
};

module.exports.async = (sourceFolder, destZipPath) => {
    return new Promise((resolve, reject) => {
        exec(`mkdir -p ${path.dirname(destZipPath)} && zip -r ${destZipPath} .`, {
            cwd: sourceFolder
        },(error, stdout, stderr) => {
            if (error || stderr)
                reject(error || stderr);
            else
                resolve(stdout);
        });
    });
};