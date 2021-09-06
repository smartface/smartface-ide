import WebSocket = require('ws');
import { hasAlreadyInitUIWs, initUIWs } from '../ui';
import LogToConsole from './LogToConsole';
import sendResetTimeout from './util/sendResetTimeout';
import WsMap from './WsMap';

const KEEPALIVE_INTERVAL = 15000;
const SERVICES = {
  CONTROL: 'control',
  FILE_TRANSFER: 'file-transfer',
  UI: 'UI',
};
const ALLOWED_SERVICES = [SERVICES.CONTROL, SERVICES.FILE_TRANSFER, SERVICES.UI];
new WsMap();
export default function controllWSS(wss: WebSocket.Server) {
  const logger = LogToConsole.instance;
  wss.on('connection', (ws: WebSocket | any) => {
    let connectedObject;
    let deviceId;
    let browserGuid;
    let eventEmitter;
    let wsServicesParent;
    logger.info('New connection request ', ws.upgradeReq.url);
    const urlParts = ws.upgradeReq.url.replace('//', '/').split('/');
    if (urlParts.length === 0) {
      return;
    }
    const service = urlParts[1];
    if (service === SERVICES.UI) {
      // $HOST:$PORT/UI/$BROWSER_GUID/$SECURITY_GUID
      browserGuid = urlParts[2];
      deviceId = 'browser';
    } else if (urlParts.length === 3) {
      // Backward compatible fix
      // $HOST:$PORT/$SERVICE/$DEVICE_ID
      deviceId = urlParts[2];
      browserGuid = deviceId;
    } else if (urlParts.length === 5) {
      // $HOST:$PORT/$SERVICE/$DEVICE_ID/$BROWSER_GUID/$SECURITY_GUID
      deviceId = urlParts[2];
      browserGuid = urlParts[3];
    } else {
      logger.log('[ERROR] Url pattern is not supported', ws.upgradeReq.url);
      // TODO: error handling
      return;
    }
    connectedObject = {
      deviceId,
      browserGuid,
    };
    logger.log('Trying to connect for', service, deviceId);

    if (ALLOWED_SERVICES.indexOf(service) === -1) {
      logger.log('Terminating ws request', service);
      return ws.terminate();
    }

    const keepAliveInterval = setInterval(() => {
      ws.send(
        JSON.stringify({
          command: 'keepAlive',
          service,
        }),
        err => {
          if (err) console.error(err);
        }
      );
    }, KEEPALIVE_INTERVAL);

    ws.on('close', () => {
      clearInterval(keepAliveInterval);
      sendResetTimeout.clear(deviceId);
      logger.info('Socket is closed by user');
    });

    ws.on('error', e => {
      logger.error('[ERROR]', 'Socket error : ', e);
    });

    function setupDeviceWS() {
      eventEmitter = new EventEmitter();
      // TODO, each deviceId can contain the browserGuid it is connected to, and can find the related websocket and eventemitter from that browserGuid
      // or that connection could be cached here as well
      // UI stuff is not written yet anyway, messages from the UI will contain deviceId if they are directed at them
      allWebsockets[deviceId] = {
        connectedObject,
        eventEmitter,
        instances: {},
        initialized: [],
        ws,
      };
      setupOnMessageEventEmitterForDevice(eventEmitter, connectedObject);
    }

    if (service === SERVICES.UI) {
      if (!hasAlreadyInitUIWs(browserGuid)) {
        initUIWs(browserGuid, ws);
      }
      logger.log('Connecting', service, browserGuid);
    } else {
      if (!allWebsockets[deviceId]) {
        setupDeviceWS();
      }
      wsServicesParent = allWebsockets[deviceId];
      if (wsServicesParent[service] && wsServicesParent[service].readyState === WebSocket.OPEN) {
        log('Terminating existing websocket', service, deviceId);
        wsServicesParent[service].terminate();
      }
      wsServicesParent[service] = ws;
      log('Connecting', service, deviceId);
      setupConnectedWebSocketForDevice(ws, service, connectedObject);
    }
  });

  log('Ready to connect');
}
