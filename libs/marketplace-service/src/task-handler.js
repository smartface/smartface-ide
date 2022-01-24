const writeError = require("./utility.js").writeError;

module.exports = (task, assetType, opt) => {
    switch (task) {
        case "export":
            return require("./exporter")(assetType, opt);
        case "import":
            return require("./importer")(assetType, opt);
        case "publish":
            return require("./publisher")(opt);
        case "install":
            return require("./installer")(opt);
        case "uninstall":
            return require("./uninstaller")(opt);
        case "serviceStart":
            return require("./server").start(opt);
        default:
            writeError("invalid task: " + task, "Task Error");
    }
};
