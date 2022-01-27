const fs = require("fs");

module.exports = path => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, "utf-8", (err, data) => {
            if (err)
                return reject(err);
            try {
                return resolve(JSON.parse(data));
            }
            catch (e) {
                return reject(e);
            }
        });
    });
};
