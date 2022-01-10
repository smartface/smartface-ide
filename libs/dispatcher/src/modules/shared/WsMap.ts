import WebSocket = require('ws');
import { EmulatorWS } from '../emulator/EmulatorWS';

export default class WsMap {
  static instance: WsMap;
  static baseImageServePath = '/ui-editor/img';
  private idewebsocket: Map<string, WebSocket>;
  private devicewebsocket: Map<string, EmulatorWS>;

  constructor() {
    WsMap.instance = this;
    this.idewebsocket = new Map<string, WebSocket>();
    this.devicewebsocket = new Map<string, EmulatorWS>();
  }

  setIDEWebSocket(key: string, ws: WebSocket) {
    this.idewebsocket.set(key, ws);
  }

  getIDEWebSocket(key: string): WebSocket {
    return this.idewebsocket.get(key);
  }

  getAllIDEWebSocket(): IterableIterator<WebSocket> {
    return this.idewebsocket.values();
  }

  delIDEWebSocket(key: string) {
    return this.idewebsocket.delete(key);
  }

  setDeviceWebSocket(key: string, emuWs: EmulatorWS) {
    this.devicewebsocket.set(key, emuWs);
  }

  getDeviceWebSocket(key: string): EmulatorWS {
    return this.devicewebsocket.get(key);
  }

  delDeviceWebSocket(key: string) {
    return this.devicewebsocket.delete(key);
  }

  getAllDeviceWebSockets(): EmulatorWS[] {
    const res: EmulatorWS[] = [];
    const itr = this.devicewebsocket.values();
    let ws: IteratorResult<EmulatorWS>;
    do {
      ws = itr.next();
      if (ws.value) {
        res.push(ws.value);
      }
    } while (!ws.done);
    return res;
  }

  getDeviceWebSocketCount(): number {
    return this.devicewebsocket.size;
  }
}
