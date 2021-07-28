const { execSync, exec } = require('child_process');

module.exports.sync = (dest) => {
    return execSync(`mkdir -p ${dest}`);
};

module.exports.async = (dest) => {
    return new Promise((resolve, reject) => {
        exec(`mkdir -p ${dest} `, (error, stdout, stderr) => {
            if (error || stderr)
                reject(error || stderr);
            else
                resolve(stdout);
        });
    });
};