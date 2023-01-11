import { IncomingMessage } from 'http';
import WebSocket = require('ws');
import { isAllowedConnection, isIDEConnection } from '../../core/connection';
import { EmulatorWS } from '../emulator/EmulatorWS';
import { hasAlreadyInitIDEWebSocket, initIDEWebSocket, removeIDEWebSocket } from '../ide';
import LogToConsole from './LogToConsole';
import KeepAliveInterval from './util/KeepAliveInterval';
import sendResetTimeout from './util/sendResetTimeout';
import WsMap from './WsMap';

new WsMap();
export default function connectionResolver(wss: WebSocket.Server) {
  const logger = LogToConsole.instance;
  const wsMap = WsMap.instance;
  //Listen wss connections/clients
  wss.on('connection', (ws: WebSocket & { upgradeReq: IncomingMessage }) => {
    let deviceId: string;
    let browserGuid: string;
    let securityGuid: string;
    const url = ws.upgradeReq.url;
    const host = ws.upgradeReq.headers.host;
    const isOverUSB = host.includes('localhost:');
    logger.info('🌐 New connection request ', url, host);
    const urlParts = url.replace('//', '/').split('/');
    if (urlParts.length === 0) {
      return;
    }
    const service = urlParts[1];
    if (isIDEConnection(service)) {
      // $HOST:$PORT/UI/$BROWSER_GUID/$SECURITY_GUID
      browserGuid = urlParts[2];
      securityGuid = urlParts[3];
      deviceId = 'browser';
    } else if (urlParts.length === 3) {
      // Backward compatible fix
      // $HOST:$PORT/$SERVICE/$DEVICE_ID
      deviceId = urlParts[2];
      browserGuid = deviceId;
      securityGuid = browserGuid;
    } else if (urlParts.length === 5) {
      // $HOST:$PORT/$SERVICE/$DEVICE_ID/$BROWSER_GUID/$SECURITY_GUID
      deviceId = urlParts[2];
      browserGuid = urlParts[3];
      securityGuid = urlParts[4];
    } else {
      return logger.error('🚨 Url pattern is not supported', url);
    }

    if (!isAllowedConnection(service)) {
      logger.log('🚨 Unallowed service... terminating ws request', service);
      return ws.terminate();
    }

    const keepAliveTimer = new KeepAliveInterval(ws, service);
    keepAliveTimer.start();

    ws.on('close', () => {
      keepAliveTimer.stop();
      sendResetTimeout.clear(deviceId);
      logger.info('💔 Socket is closed by user ', service, 'B→', browserGuid);
      if (isIDEConnection(service)) {
        removeIDEWebSocket(browserGuid);
      }
    });

    ws.on('error', e => {
      logger.error('🚨 Socket error: ', e);
    });

    if (isIDEConnection(service)) {
      if (!hasAlreadyInitIDEWebSocket(browserGuid)) {
        initIDEWebSocket(browserGuid, ws);
      }
    } else {
      let emuWsItem = wsMap.getDeviceWebSocket(deviceId);
      console.log(
        'EmuWsItem is available in cache -> ',
        !!emuWsItem,
        'S→',
        emuWsItem?.securityGuid
      );
      if (!emuWsItem) {
        emuWsItem = new EmulatorWS(deviceId, browserGuid, isOverUSB, securityGuid);
      }
      emuWsItem.setupServiceWs(service, ws);
    }
    logger.log('📡 Connecting', service, browserGuid, '←B S→', securityGuid);
  });
  logger.log('🌍 Ready to connect ...');
}
