const { execSync, exec } = require('child_process');

module.exports.sync = (soure, dest, option) => {
    option = option || {};
    return execSync(`mkdir -p ${dest} && mv -${prepareOption(option)} ${soure} ${dest}`, {
        shell: "/bin/bash"
    });
};

module.exports.async = (soure, dest, option) => {
    option = option || {};
    return new Promise((resolve, reject) => {
        exec(`mkdir -p ${dest} && mv ${soure} ${dest} `, {
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
    return `${opt.no_target_folder ? "T" : "v"}`;
}
