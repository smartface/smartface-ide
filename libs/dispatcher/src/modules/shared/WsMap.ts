import WebSocket = require('ws');

type DeviceWSMapType = {
  connectedObject: {
    deviceId: string;
    browserGuid: string;
  };
  instances: any;
  initialized: any[];
  ws: WebSocket;
};

export default class WsMap {
  static instance: WsMap;
  static baseImageServePath = '/ui-editor/img';
  __uiws: Map<string, WebSocket>;
  __devicews: Map<string, DeviceWSMapType>;

  constructor() {
    WsMap.instance = this;
    this.__uiws = new Map<string, WebSocket>();
    this.__devicews = new Map<string, DeviceWSMapType>();
  }

  setUIWs(key: string, ws: WebSocket) {
    this.__uiws.set(key, ws);
  }

  getUIWs(key: string): WebSocket {
    return this.__uiws.get(key);
  }

  delUIWs(key: string) {
    return this.__uiws.delete(key);
  }

  setDeviceWs(key: string, deviceWsMapItem: DeviceWSMapType) {
    this.__devicews.set(key, deviceWsMapItem);
  }

  getDeviceWs(key: string): DeviceWSMapType {
    return this.__devicews.get(key);
  }

  delDeviceWs(key: string) {
    return this.__devicews.delete(key);
  }
}
