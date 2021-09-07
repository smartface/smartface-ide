import WebSocket = require('ws');
import { isConsoleCommands } from '../../core/services';
import LogToConsole from '../shared/LogToConsole';
import WsMap from '../shared/WsMap';
import parseEachJSON = require('ws-json-organizer');
import { sendToIdeWs } from '../ide';

export class EmulatorWS {
  static setDeviceWs(deviceId: string, deviceWsMapItem: EmulatorWS) {
    WsMap.instance.setDeviceWs(deviceId, deviceWsMapItem);
  }
  static clearDeviceWs(deviceId: string) {
    WsMap.instance.delDeviceWs(deviceId);
  }
  private logger: LogToConsole;
  private __serviceWsMap: Map<string, WebSocket>;

  constructor(private deviceId: string, private browserGuid: string) {
    this.logger = LogToConsole.instance;
    EmulatorWS.setDeviceWs(deviceId, this);
    this.deviceId;
    this.__serviceWsMap = new Map();
  }

  setupServiceWs(service: string, ws: WebSocket) {
    const serviceWs = this.__serviceWsMap.get(service);
    if (serviceWs && serviceWs.readyState === WebSocket.OPEN) {
      LogToConsole.instance.log('Terminating existing websocket', service, this.deviceId);
      serviceWs.terminate();
    }
    this.__serviceWsMap.set(service, ws);
    serviceWs.on('message', message => {
      parseEachJSON(message, (err, parsedMessage) => {
        if (err) {
          setTimeout(() => {
            this.logger.error(err);
            throw err;
          }, 1);
        }
        this.logger.log(
          '\n[MESSAGE RECEIVED]:[',
          this.deviceId,
          '/',
          service,
          ']:\n',
          parsedMessage.command,
          '\n'
        );
        if (parsedMessage && parsedMessage.command && isConsoleCommands(parsedMessage.command)) {
          //TODO add deviceInfo from getIndex Command
          sendToIdeWs(this.browserGuid, {
            ...parsedMessage,
            connectedObject: {
              deviceId: this.deviceId,
              browserGuid: this.browserGuid,
              deviceInfo: { deviceID: this.deviceId },
            },
          });
        }
      });
    });

    serviceWs.on('close', e => {
      EmulatorWS.clearDeviceWs(this.deviceId);
      this.__serviceWsMap.delete(service);
    });
  }
}
