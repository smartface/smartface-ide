const fs = require('fs-extra');
const path = require("path");
const getPath = require("./config").getPath;
const DEFAULT_PATHS = require("./config").DEFAULT_PATHS,
    LIBRARY_FILE_NAME = DEFAULT_PATHS.LIBRARY_FILE_NAME,
    MODULES_FILE_NAME = DEFAULT_PATHS.MODULES_FILE_NAME;
const shortid = require("shortid");

function checkComponentsTestID(pgxSource) {
    let dirty = false;
    pgxSource.components.forEach(component => {
        //console.log("├─ ℹ️  checkComponentsTestID -- ", component.props.name);
        if (component.props.usePageVariable === true && component.type !== "StatusBar" && component.type !== "HeaderBar" && !component.userProps.testId) {
            component.userProps.testId = shortid.generate();
            dirty = true;
            console.log("├─ ℹ️  found empty tester-id --> ", component.props.name, " => " ,component.userProps.testId);
        }
    });

    return dirty;
}

function writePgx(filePath, pgxSource){
    fs.writeFileSync(filePath, JSON.stringify(pgxSource, null, '\t'), "utf8");
    console.log("├─ ℹ️  saved new source with tester-ids --> ", filePath);
}

function readAndCheckComponentsTestID() {
    console.log("readAndCheckComponentsTestID");
    const pgxFolder = getPath("PGX_FOLDER");
    fs.readdir(pgxFolder, (err, files) => {
        if (err)
            return console.error("readAndCheckComponentsTestID Error -> fs.readdir : pgxFolder -> " + err.toString(), pgxFolder);
        var promiseArr = [];
        files.filter(item => (item != "library" && item != LIBRARY_FILE_NAME) && (item !== MODULES_FILE_NAME))
            .forEach(item => {
                const pgxPath = path.join(pgxFolder, item);
                fs.readFile(pgxPath, "binary", (e, data) => {
                    const pgxSource =  JSON.parse(data);
                    if(checkComponentsTestID(pgxSource))
                        writePgx(pgxPath, pgxSource);
                });
            });
    });
}


module.exports = {
    readAndCheckComponentsTestID,
    checkComponentsTestID,
    writePgx
}