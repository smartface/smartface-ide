const writeError = require("../utility.js").writeError;

const EXPORTERS = {
    library: "./component-exporter",
    page: "./page-exporter"
};

module.exports = (type, opt) => {
    if (!EXPORTERS[type])
        return writeError("no exporter found for this type: " + type, "Type Error");
    var exporter = require(EXPORTERS[type]);
    return exporter(opt);
};
