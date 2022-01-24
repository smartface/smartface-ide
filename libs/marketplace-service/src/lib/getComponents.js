const fs = require("fs");

module.exports = pgxFile => {
    return new Promise((resolve, reject) => {
        try {
            var content = fs.readFileSync(pgxFile, "utf-8");
            resolve(JSON.parse(content).components);
        }
        catch (e) {
            e.file = pgxFile;
            return reject(e);
        }
    });
};
