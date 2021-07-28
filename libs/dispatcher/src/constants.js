const args = require('minimist')(process.argv.slice(2));

module.exports = {
    WORKSPACE_PATH: process.env.WORKSPACE_ROOT || args.rootPath || (process.env.ROOT_PATH || process.env.SMF_CIDE_WS_PATH || '/home/ubuntu/workspace')
};