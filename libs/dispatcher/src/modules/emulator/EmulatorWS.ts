import WebSocket = require('ws');
import { isConsoleCommands } from '../../core/connection';
import LogToConsole from '../shared/LogToConsole';
import WsMap from '../shared/WsMap';
import parseEachJSON = require('ws-json-organizer');
import { sendToIDEWebSocket } from '../ide';
import GetFilesIndexCommand from './command/GetFilesIndexCommand';
import ackErrorGenerator from '../shared/util/ackErrorGenerator';
import sendChunkedMessage, { WebsocketWithStream } from '../shared/util/sendChunkedMessage';
import createCommandMessage from '../shared/util/createCommandMessage';
import GetFilesDataCommand from './command/GetFilesDataCommand';
import {
  CommandType,
  ConsoleCommandType,
  DeviceInfoType,
  GetFilesCommandType,
  GetIndexCommandType,
} from '../../core/CommandTypes';
import { FileInfoType } from '../../core/WorkspaceIndexTypes';

export class EmulatorWS {
  static setDeviceWs(deviceId: string, deviceWsMapItem: EmulatorWS) {
    WsMap.instance.setDeviceWebSocket(deviceId, deviceWsMapItem);
  }
  static clearDeviceWs(deviceId: string) {
    WsMap.instance.delDeviceWebSocket(deviceId);
  }
  private logger: LogToConsole;
  private serviceWsMap: Map<string, WebSocket>;
  private deviceInfo: DeviceInfoType;
  private indexFiles: FileInfoType[] = [];

  constructor(private deviceId: string, private browserGuid: string) {
    this.logger = LogToConsole.instance;
    EmulatorWS.setDeviceWs(deviceId, this);
    this.deviceId;
    this.serviceWsMap = new Map();
  }

  setupServiceWs(service: string, ws: WebSocket) {
    let serviceWs: WebsocketWithStream = this.serviceWsMap.get(service) as WebsocketWithStream;
    if (serviceWs && serviceWs.readyState === WebSocket.OPEN) {
      LogToConsole.instance.log('Terminating existing websocket', service, this.deviceId);
      serviceWs.terminate();
    } else {
      serviceWs = ws as WebsocketWithStream;
    }
    this.serviceWsMap.set(service, ws);
    serviceWs.on('message', message => {
      parseEachJSON(message.toString(), async (err, parsedMessage: CommandType) => {
        if (err) {
          return setTimeout(() => {
            this.logger.error(err);
            throw err;
          }, 1);
        }
        this.logger.log(service, 'ws.onMessage', this.deviceId, parsedMessage);
        if (parsedMessage.command && isConsoleCommands(parsedMessage.command)) {
          //TODO add deviceInfo from getIndex Command
          sendToIDEWebSocket(this.browserGuid, {
            ...(parsedMessage as ConsoleCommandType),
            connectedObject: {
              deviceId: this.deviceId,
              browserGuid: this.browserGuid,
              deviceInfo: this.deviceInfo,
            },
          });
        } else if (parsedMessage.command === 'getIndex') {
          this.deviceInfo = (parsedMessage as GetIndexCommandType).data;
          const data = await new GetFilesIndexCommand().execute({ deviceInfo: this.deviceInfo });
          this.indexFiles = data.files;
          sendChunkedMessage(
            serviceWs,
            JSON.stringify(createCommandMessage('getFiles', data)),
            false,
            ackErrorGenerator('Error while sending "getIndex" command')
          );
        } else if (parsedMessage.command === 'getFiles') {
          const zipData = await new GetFilesDataCommand().execute({
            os: this.deviceInfo.os,
            files: (parsedMessage as GetFilesCommandType).data.files,
            indexFiles: this.indexFiles,
          });
          sendChunkedMessage(
            serviceWs,
            JSON.stringify(
              createCommandMessage('fileSize', {
                size: zipData.byteLength,
              })
            ),
            false,
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
      this.serviceWsMap.delete(service);
    });
  }
}
