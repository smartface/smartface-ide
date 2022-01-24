const writeError = require("../utility.js").writeError;

const IMPORTERS = {
    library: "./component-importer",
    page: "./page-importer"
};

module.exports = (type, opt, cb) => {
    if (!IMPORTERS[type])
        return writeError("no importer found for this type: " + type, "Type Error");
    var importer = require(IMPORTERS[type]);
    return importer(opt, cb);
};
