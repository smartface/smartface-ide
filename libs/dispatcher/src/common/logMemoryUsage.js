var bytes = require("bytes");

module.exports = function(msg) {
    var mem = process.memoryUsage();
    console.log("==============================\n");
    console.log(msg);
    console.log("rss", bytes(mem.rss, {
        unitSeparator: " "
    }));
    console.log("heapTotal", bytes(mem.heapTotal, {
        unitSeparator: " "
    }));
    console.log("heapUsed", bytes(mem.heapUsed, {
        unitSeparator: " "
    }));
    console.log("external", bytes(mem.external, {
        unitSeparator: " "
    }));
    console.log("==============================\n");
};
