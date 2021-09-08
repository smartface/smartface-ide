import WebSocket = require('ws');
import {
  isAllowedConnection,
  isIDEConnection,
} from '../../core/connection';
import { EmulatorWS } from '../emulator/EmulatorWS';
import { hasAlreadyInitUIWs, initUIWs } from '../ide';
import LogToConsole from './LogToConsole';
import KeepAliveInterval from './util/KeepAliveInterval';
import sendResetTimeout from './util/sendResetTimeout';
import WsMap from './WsMap';

new WsMap();
export default function connectionResolver(wss: WebSocket.Server) {
  const logger = LogToConsole.instance;
  const wsMap = WsMap.instance;
  //Listen wss connections/clients
  wss.on('connection', (ws: WebSocket | any) => {
    let deviceId: string;
    let browserGuid: string;
    logger.info('New connection request ', ws.upgradeReq.url);
    const urlParts = ws.upgradeReq.url.replace('//', '/').split('/');
    if (urlParts.length === 0) {
      return;
    }
    const service = urlParts[1];
    if (isIDEConnection(service)) {
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
      return logger.error('[ERROR] Url pattern is not supported', ws.upgradeReq.url);
    }
    logger.log('Trying to connect for', service, deviceId);

    if (!isAllowedConnection(service)) {
      logger.log('Terminating ws request', service);
      return ws.terminate();
    }

    const keepAliveTimer = new KeepAliveInterval(ws, service);
    keepAliveTimer.start();

    ws.on('close', () => {
      keepAliveTimer.stop();
      sendResetTimeout.clear(deviceId);
      logger.info('Socket is closed by user');
    });

    ws.on('error', e => {
      logger.error('[ERROR]', 'Socket error : ', e);
    });

    if (isIDEConnection(service)) {
      if (!hasAlreadyInitUIWs(browserGuid)) {
        initUIWs(browserGuid, ws);
      }
      logger.log('Connecting', service, browserGuid);
    } else {
      let emuWsItem = wsMap.getDeviceWs(deviceId);
      if (!emuWsItem) {
        emuWsItem = new EmulatorWS(deviceId, browserGuid);
      }
      emuWsItem.setupServiceWs(service, ws);
      logger.log('Connecting', service, deviceId);
    }
  });
  logger.log('Ready to connect');
}
