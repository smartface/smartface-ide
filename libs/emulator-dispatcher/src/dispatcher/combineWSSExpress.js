/**
 * @typedef {Object} getCombinedWSSResult
 * @prop {WebSocketServer} wss - Object created to handle ws connections
 * @prop {http.Server} server - HTTP Server object created on the way
 * @prop {ExpressApp} app - Provided app value or newly created one
 *
 *
 * Creates a combined WebSocketServer with Express Server
 * @param {WebSocketServer} WebSocketServer - class of WebSocketServer
 * @param {express} express - library of express
 * @param {Object|number} options - WSS options or the port number; server value will be replaced
 * @param {ExpressApp} app - (Optional) Previously created express app; If empty one will be created automatically
 * @return {getCombinedWSSResult} - wss and all created artifacts along the way
 */
const LogToConsole = require('../common/LogToConsole');

function getCombinedWSS(WebSocketServer, express, options, app) {
  const { execSync } = require('child_process');
  const http = require('http');
  app = app || express();
  const server = http.createServer(app);
  let port;
  const { log } = new LogToConsole(options.logToConsole, '[HTTP]');

  if (typeof options === 'number') {
    port = options;
    options = {};
  } else {
    port = options.port;
    delete options.port;
  }
  if (global.v8debug) {
    try {
      execSync('fuser -k 8081/tcp');
    } catch (ex) {
      // do nothing; process is not running; everything is OK
    }
  }
  server.on('error', (err) => {
    if (global.v8debug) {
      debugger;
    } else {
      log('[ERROR]', err);
      throw err;
    }
  });
  server.listen(port, options.host);
  options.server = server;

  log('Server listening on', port);
  const wss = new WebSocketServer(options);

  return {
    wss,
    server,
    app
  };
}
module.exports = getCombinedWSS;
