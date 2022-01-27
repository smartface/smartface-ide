const path = require("path");

module.exports = {
    BRACKET_END: "$(B_R-A_C-K_E-T)",
    SOCKET_PATH: path.join( process.env.ROOT_PATH || process.env.SMF_CIDE_WS_PATH || path.join(process.env.HOME, "workspace"), '.smf', 'app.sfLibraryManager'),
    SERVER_APP_NAME: "sfMarketplaceService",
    CLIENT_APP_NAME: "sfMarketplaceServiceClient",
    SERVER_PORT: 8011
};