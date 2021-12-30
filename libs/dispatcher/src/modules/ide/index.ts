import WsMap from '../shared/WsMap';
import WebSocket = require('ws');
import { ConsoleCommandType, DeviceInfoType, EmulatorCommandType } from '../../core/CommandTypes';

export function initIDEWebSocket(browserGuid: string, ws: WebSocket) {
    WsMap.instance.setIDEWebSocket(browserGuid, ws);
}

export function removeIDEWebSocket(browserGuid: string) {
    WsMap.instance.delIDEWebSocket(browserGuid);
}

export function hasAlreadyInitIDEWebSocket(browserGuid: string) {
    return !!WsMap.instance.getIDEWebSocket(browserGuid);
}

function getIdeWebSocket(browserGuid: string) {
    const ws = WsMap.instance.getIDEWebSocket(browserGuid);
    if (ws && ws.readyState === WebSocket.OPEN) {
        return ws;
    }
    return null;
}

export function sendToIDEWebSocket(
  browserGuid: string,
  parsedMessage: (ConsoleCommandType & { connectedObject: { browserGuid: string; deviceId: string; deviceInfo: DeviceInfoType } }) | EmulatorCommandType
) {
  const ws = getIdeWebSocket(browserGuid);
  if (ws) {
    ws.send(JSON.stringify(parsedMessage));
  } else {
    const itrIdeWs = WsMap.instance.getAllIDEWebSocket();
    while (itrIdeWs) {
      const val = itrIdeWs.next();
      if (val.done) {
        return;
      }
      const wsItem = val.value;
      if (wsItem.readyState === WebSocket.OPEN) {
        wsItem.send(JSON.stringify(parsedMessage));
      }
    }
  }
}
