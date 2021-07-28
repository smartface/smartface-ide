const INTERVAL_DELAY = 5000; // 5 sec

const util = require("../util");
const isExistsFileDir = util.isExistsFileDir;

function intervalChecker(path, isFile, doCallback, erorCallback) {
    const helper = (ignoreExistingCallback) => {
        isExistsFileDir(path).then(res => {
            if (res.existing && res.file === isFile) {
                !ignoreExistingCallback && doCallback && doCallback();
            }
            else {
                erorCallback && erorCallback();
            }
        });
    };
    helper(); // check first
    return setInterval(helper.bind(null, true), INTERVAL_DELAY);
}


module.exports = intervalChecker;
