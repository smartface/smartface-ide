import WebSocket = require('ws');
import { EmulatorWS } from '../emulator/EmulatorWS';

export default class WsMap {
                 static instance: WsMap;
                 static baseImageServePath = '/ui-editor/img';
                 __uiws: Map<string, WebSocket>;
                 __devicews: Map<string, EmulatorWS>;

                 constructor() {
                   WsMap.instance = this;
                   this.__uiws = new Map<string, WebSocket>();
                   this.__devicews = new Map<string, EmulatorWS>();
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
