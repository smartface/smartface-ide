import WebSocket = require('ws');
import { isConsoleCommands } from '../../core/connection';
import LogToConsole from '../shared/LogToConsole';
import WsMap from '../shared/WsMap';
import parseEachJSON = require('ws-json-organizer');
import { sendToIDEWs } from '../ide';
import GetFilesIndexCommand from './command/GetFilesIndexCommand';
import ackErrorGenerator from '../shared/util/ackErrorGenerator';
import sendChunkedMessage from '../shared/util/sendChunkedMessage';
import createCommandMessage from '../shared/util/createCommandMessage';
import GetFilesDataCommand from './command/GetFilesDataCommand';

export class EmulatorWS {
  static setDeviceWs(deviceId: string, deviceWsMapItem: EmulatorWS) {
    WsMap.instance.setDeviceWs(deviceId, deviceWsMapItem);
  }
  static clearDeviceWs(deviceId: string) {
    WsMap.instance.delDeviceWs(deviceId);
  }
  private logger: LogToConsole;
  private __serviceWsMap: Map<string, WebSocket>;
  private __deviceInfo: any = {};
  private __files: string[] = [];

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
      parseEachJSON(message, async (err, parsedMessage) => {
        if (err) {
          return setTimeout(() => {
            this.logger.error(err);
            throw err;
          }, 1);
        }
        this.logger.log(
          '\n[MESSAGE RECEIVED]:[',
          this.deviceId,
          '/',
          service,
          ']:',
          parsedMessage.command
        );
        if (parsedMessage.command && isConsoleCommands(parsedMessage.command)) {
          //TODO add deviceInfo from getIndex Command
          sendToIDEWs(this.browserGuid, {
            ...parsedMessage,
            connectedObject: {
              deviceId: this.deviceId,
              browserGuid: this.browserGuid,
              deviceInfo: this.__deviceInfo || { deviceID: this.deviceId },
            },
          });
        } else if (parsedMessage.command === 'getIndex') {
          this.__deviceInfo = parsedMessage.data;
          const data = await new GetFilesIndexCommand().execute({ deviceInfo: this.__deviceInfo });
          this.__files = data.files as string[];
          sendChunkedMessage(
            serviceWs,
            JSON.stringify(createCommandMessage('getFiles', data)),
            false,
            ackErrorGenerator('Error while sending "getIndex" command')
          );
        } else if (parsedMessage.command === 'getFiles') {
          this.__deviceInfo = parsedMessage.data;
          const zipData = await new GetFilesDataCommand().execute({
            os: this.__deviceInfo.os,
            files: this.__files,
          });
          sendChunkedMessage(
            serviceWs,
            JSON.stringify(
              createCommandMessage('fileSize', {
                size: zipData.byteLength,
              })
            ),
            true,
            (err, result) => {
              if (err) {
                return this.logger.error(
                  '**ERROR** An error occured while sending the size of the file'
                );
              }
              sendChunkedMessage(
                serviceWs,
                zipData,
                true,
                ackErrorGenerator('**ERROR** An error occured while sending the zip data of files')
              );
            }
          );
        }
      });
    });

    serviceWs.on('close', e => {
      EmulatorWS.clearDeviceWs(this.deviceId);
      this.__serviceWsMap.delete(service);
    });
  }
}
