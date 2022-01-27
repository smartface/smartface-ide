const { execSync, exec } = require('child_process');
const path = require("path");

module.exports.sync = (sourceZip, destFolder) => {
    return execSync(`mkdir -p ${path.dirname(destFolder)} && unzip ${sourceZip} -d ${destFolder}`);
};

module.exports.async = (sourceZip, destFolder) => {
    return new Promise((resolve, reject) => {
        exec(`mkdir -p ${path.dirname(destFolder)} && unzip ${sourceZip} -d ${destFolder}`,
            (error, stdout, stderr) => {
                if (error || stderr)
                    reject(error || stderr);
                else
                    resolve(stdout);
            });
    });
};
