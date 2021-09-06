import WsMap from '../shared/WsMap';
import WebSocket = require('ws');

export function initUIWs(browserGuid: string, ws: WebSocket) {
  WsMap.instance.setUIWs(browserGuid, ws);
}

export function removeUIWs(browserGuid: string) {
  WsMap.instance.delUIWs(browserGuid);
}

export function hasAlreadyInitUIWs(browserGuid: string) {
  return !!WsMap.instance.getUIWs(browserGuid);
}