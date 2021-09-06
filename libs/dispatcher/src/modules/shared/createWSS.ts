import { execSync } from 'child_process';

import * as WebSocket from 'ws';


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


export default function createWSS({ port=8081, server, host='localhost'}) : WebSocket.Server {
  if (global.v8debug) {
    try {
      execSync(`fuser -k ${port}/tcp`);
    } catch (ex) {
      console.error("Port has been already using");
      return;
    }
  }

  const wss = new WebSocket.Server({port, host, server});
  console.info('WSS Server listening on', port);
  return wss;
}