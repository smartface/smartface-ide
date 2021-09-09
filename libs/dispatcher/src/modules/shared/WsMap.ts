import WebSocket = require('ws');
import { EmulatorWS } from '../emulator/EmulatorWS';

export default class WsMap {
    static instance: WsMap;
    static baseImageServePath = '/ui-editor/img';
    __idewebsocket: Map<string, WebSocket>;
    __devicewebsocket: Map<string, EmulatorWS>;

    constructor() {
        WsMap.instance = this;
        this.__idewebsocket = new Map<string, WebSocket>();
        this.__devicewebsocket = new Map<string, EmulatorWS>();
    }

    setIDEWebSocket(key: string, ws: WebSocket) {
        this.__idewebsocket.set(key, ws);
    }

    getIDEWebSocket(key: string): WebSocket {
        return this.__idewebsocket.get(key);
    }

    getAllIDEWebSocket(): IterableIterator<WebSocket> {
        return this.__idewebsocket.values();
    }

    delIDEWebSocket(key: string) {
        return this.__idewebsocket.delete(key);
    }

    setDeviceWebSocket(key: string, emuWs: EmulatorWS) {
        this.__devicewebsocket.set(key, emuWs);
    }

    getDeviceWebSocket(key: string): EmulatorWS {
        return this.__devicewebsocket.get(key);
    }

    delDeviceWebSocket(key: string) {
        return this.__devicewebsocket.delete(key);
    }
}
