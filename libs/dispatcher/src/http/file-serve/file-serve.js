const path = require("path");
const CONSTANTS = require("../../constants");

module.exports = function (express, app, options) {
    options = options || {};
    console.log('Static File Serving :> ', path.join(CONSTANTS.WORKSPACE_PATH));
    app.use('/files', express.static(path.join(CONSTANTS.WORKSPACE_PATH)));
};
