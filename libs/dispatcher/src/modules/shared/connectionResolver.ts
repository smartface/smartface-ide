import WebSocket = require('ws');
import { isAllowedService, isIDEService } from '../../core/services';
import { EmulatorWS } from '../emulator/EmulatorWS';
import { hasAlreadyInitUIWs, initUIWs } from '../ide';
import LogToConsole from './LogToConsole';
import sendResetTimeout from './util/sendResetTimeout';
import WsMap from './WsMap';

const KEEPALIVE_INTERVAL = 15000;

new WsMap();
export default function controllWSS(wss: WebSocket.Server) {
  const logger = LogToConsole.instance;
  const wsMap = WsMap.instance;
  wss.on('connection', (ws: WebSocket | any) => {
    let deviceId: string;
    let browserGuid: string;
    logger.info('New connection request ', ws.upgradeReq.url);
    const urlParts = ws.upgradeReq.url.replace('//', '/').split('/');
    if (urlParts.length === 0) {
      return;
    }
    const service = urlParts[1];
    if (isIDEService(service)) {
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
      return logger.log('[ERROR] Url pattern is not supported', ws.upgradeReq.url);
    }
    logger.log('Trying to connect for', service, deviceId);

    if (!isAllowedService(service)) {
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

    if (isIDEService(service)) {
      if (!hasAlreadyInitUIWs(browserGuid)) {
        initUIWs(browserGuid, ws);
      }
      logger.log('Connecting', service, browserGuid);
    } else {
      let emuWsItem = wsMap.getDeviceWs(deviceId);
      if (!emuWsItem) {
        emuWsItem = new EmulatorWS(ws, deviceId, browserGuid);
      }
      emuWsItem.setupServiceWs(service, ws);
      logger.log('Connecting', service, deviceId);
    }
  });
  logger.log('Ready to connect');
}
