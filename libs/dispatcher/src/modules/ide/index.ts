import WsMap from '../shared/WsMap';
import WebSocket = require('ws');
import LogToConsole from '../shared/LogToConsole';

export function initUIWs(browserGuid: string, ws: WebSocket) {
  WsMap.instance.setUIWs(browserGuid, ws);
}

export function removeUIWs(browserGuid: string) {
  WsMap.instance.delUIWs(browserGuid);
}

export function hasAlreadyInitUIWs(browserGuid: string) {
  return !!WsMap.instance.getUIWs(browserGuid);
}

function getIdeWs(browserGuid: string) {
  const ws = WsMap.instance.getUIWs(browserGuid);
  if (ws && ws.readyState === WebSocket.OPEN) {
    return ws;
  }
  return null;
}

export function sendToIdeWs(browserGuid: string, parsedMessage: any) {
  const ws = getIdeWs(browserGuid);
  if (ws) {
  } else {
    LogToConsole.instance.warn(
      'UI Websocket not found for: ',
      browserGuid,
      ' --> send msg to all of them'
    );
    const itrIdeWs = WsMap.instance.getAllIdeWs();
    while (1) {
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
