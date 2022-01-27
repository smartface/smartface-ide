const { execSync, exec } = require('child_process');
const path = require("path");

module.exports.sync = (soure, dest, option) => {
    option = option || {};
    return execSync(`mkdir -p ${option.isRelPathFull ? path.dirname(dest):dest} && cp -ar${prepareOption(option)} ${soure} ${dest} `, {
        shell: "/bin/bash"
    });
};

module.exports.async = (soure, dest, option) => {
    option = option || {};
    return new Promise((resolve, reject) => {
        exec(`mkdir -p ${option.isRelPathFull ? path.dirname(dest):dest} && cp -ar${prepareOption(option)} ${soure} ${dest} `, {
                shell: "/bin/bash"
            },
            (error, stdout, stderr) => {
                //console.log(stdout, stderr);
                if (error || stderr)
                    reject(error || stderr);
                else
                    resolve(stdout);
            });
    });
};

function prepareOption(opt) {
    return `${opt.no_target_folder ? "T" : ""}`;
}
