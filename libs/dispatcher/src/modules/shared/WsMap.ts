import WebSocket = require('ws');
import { EmulatorWS } from '../emulator/EmulatorWS';

export default class WsMap {
  static instance: WsMap;
  static baseImageServePath = '/ui-editor/img';
  __idews: Map<string, WebSocket>;
  __devicews: Map<string, EmulatorWS>;

  constructor() {
    WsMap.instance = this;
    this.__idews = new Map<string, WebSocket>();
    this.__devicews = new Map<string, EmulatorWS>();
  }

  setIdeWs(key: string, ws: WebSocket) {
    this.__idews.set(key, ws);
  }

  getIdeWs(key: string): WebSocket {
    return this.__idews.get(key);
  }

  getAllIdeWs(): IterableIterator<WebSocket> {
    return this.__idews.values();
  }

  delIdeWs(key: string) {
    return this.__idews.delete(key);
  }

  setDeviceWs(key: string, emuWs: EmulatorWS) {
    this.__devicews.set(key, emuWs);
  }

  getDeviceWs(key: string): EmulatorWS {
    return this.__devicews.get(key);
  }

  delDeviceWs(key: string) {
    return this.__devicews.delete(key);
  }
}
