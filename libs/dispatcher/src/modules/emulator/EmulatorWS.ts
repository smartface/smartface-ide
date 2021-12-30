import WebSocket = require('ws');
import uuid = require('uuid');
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
  //cache deviceinfos.
  static deviceInfos: Map<string, DeviceInfoType> = new Map();

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
    this.deviceInfo = EmulatorWS.deviceInfos.get(this.deviceId);
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
          EmulatorWS.deviceInfos.set(this.deviceId, this.deviceInfo);
          const data = await new GetFilesIndexCommand().execute({ deviceInfo: this.deviceInfo });
          this.indexFiles = data.files as FileInfoType[];
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
      EmulatorWS.sendReadyConnectedDevices();
    });
    EmulatorWS.sendReadyConnectedDevices();
  }

  async sendUpdateCode(cb?: (errs: string[]) => {}) {
    let serviceWs: WebsocketWithStream = this.serviceWsMap.get('control') as WebsocketWithStream;
    const data = await new GetFilesIndexCommand().execute({ deviceInfo: this.deviceInfo });
    this.indexFiles = data.files as FileInfoType[];
    console.info('---- Send UPDATE ----');
    sendChunkedMessage(
      serviceWs,
      JSON.stringify(createCommandMessage('getFiles', data)),
      false,
      err => {
        if (err) {
          ackErrorGenerator('Error while sending "getIndex" command')(err);
        }
        console.info('Sendind Done.');
        cb && cb(err);
      }
    );
  }

  static async sendUpdateConnectedDevices() {
    sendToIDEWebSocket('sendAll', {
      id: uuid.v4(),
      command: 'emulators_updating',
      data: {
        emulatorsCount: WsMap.instance.getDeviceWebSocketCount(),
      },
    });
    const itr = WsMap.instance.getAllDeviceWebSockets();
    itr;
    let ws = itr.next();
    let doneCount = 0;
    const done = err => {
      ++doneCount;
      if (err || doneCount === WsMap.instance.getDeviceWebSocketCount()) {
        setTimeout(() => {
          sendToIDEWebSocket('sendAll', {
            id: uuid.v4(),
            command: err ? 'emulators_error' : 'emulators_updated',
            data: {
              emulatorsCount: WsMap.instance.getDeviceWebSocketCount(),
              message: err ? err.join(',') : 'Emulators updated.',
            },
          });
        }, 2000);
      }
    };
    do {
      if (ws.value) {
        ws.value.sendUpdateCode(done);
      }
      ws = itr.next();
    } while (!ws.done);
  }

  static async sendReadyConnectedDevices() {
    sendToIDEWebSocket('sendAll', {
      id: uuid.v4(),
      command: 'emulators_ready',
      data: {
        emulatorsCount: WsMap.instance.getDeviceWebSocketCount(),
      },
    });
  }
}
/*

node ./lib/index.js --rootPath /Users/SMARTFACE/Desktop/son_boiler --bypasssecuritycheck --port 52200 --host 0.0.0.0  
*/
