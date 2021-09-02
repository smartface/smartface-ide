import { execSync } from 'child_process';
import { Server, createServer } from 'http';

import { Express } from 'express';
import * as WebSocket from 'ws';
import LogToConsole from './LogToConsole';


/**
 * @typedef {Object} getCombinedWSSResult
 * @prop {http.Server} server - HTTP Server object created on the way
 * @prop {ExpressApp} app - Provided app value or newly created one
 *
 *
 * Creates a combined WebSocketServer with Express Server
 * @param {express} express - library of express
 * @param {Object|number} options - WSS options or the port number; server value will be replaced
 * @param {ExpressApp} app - (Optional) Previously created express app; If empty one will be created automatically
 * @return {getCombinedWSSResult} - wss and all created artifacts along the way
 */


export default function getCombinedWSS(options = { port: 8081, logToConsole: true, server: null, host: 'localhost'}, app: Express) : { wss: WebSocket.Server, server: Server  } {
  const server = createServer(app);
  const logger = new LogToConsole(options.logToConsole, '[HTTP]');
  const port = options.port;
  delete options.port;
  
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
      logger.log('[ERROR]', err);
      throw err;
    }
  });
  server.listen(port, options.host);
  options.server = server;

  logger.log('Server listening on', port);
  const wss = new WebSocket.Server(options);
  logger.log('WSS Server listening on', port);
  return {
    wss,
    server,
  };
}