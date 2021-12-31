import WebSocket = require('ws');
import EventEmitter = require('events');
import { isConsoleCommands } from '../../core/connection';
import LogToConsole from '../shared/LogToConsole';
import WsMap from '../shared/WsMap';
import parseEachJSON = require('ws-json-organizer');
import {
  sendToIDEEmulatorsAreReady,
  sendToIDEEmulatorsAreUpdated,
  sendToIDEEmulatorsAreUpdating,
  sendToIDEWebSocket,
} from '../ide';
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

export enum EmulatorStatus {
  READY = 'READY',
  UPDATING = 'UPDATING',
  UPDATED = 'UPDATED',
  ERROR = 'ERROR',
}

export class EmulatorWS extends EventEmitter {
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
  public deviceInfo: DeviceInfoType;
  private indexFiles: FileInfoType[] = [];
  private _status: EmulatorStatus;
  private set status(_status: EmulatorStatus) {
    this._status = _status;
    this.emit('statusChange', _status);
  }
  public get status() {
    return this._status;
  }
  constructor(public deviceId: string, public browserGuid: string, public isOverUSB: boolean) {
    super();
    this.logger = LogToConsole.instance;
    EmulatorWS.setDeviceWs(deviceId, this);
    this.deviceId;
    this.serviceWsMap = new Map();
    this.deviceInfo = EmulatorWS.deviceInfos.get(this.deviceId);
    if (this.deviceInfo) {
      this.deviceInfo.isOverUSB = this.isOverUSB;
    }
    this.status = EmulatorStatus.READY;
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
          this.deviceInfo.isOverUSB = this.isOverUSB;
          EmulatorWS.deviceInfos.set(this.deviceId, this.deviceInfo);
          this.sendUpdateCode();
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
                this.status = EmulatorStatus.ERROR;
                return this.logger.error(
                  '**ERROR** An error occured while sending the size of the file'
                );
              }
              sendChunkedMessage(serviceWs, zipData, true, (err, result) => {
                if (err) {
                  this.status = EmulatorStatus.ERROR;
                  ackErrorGenerator(
                    '**ERROR** An error occured while sending the zip data of files'
                  );
                }
                this.status = EmulatorStatus.UPDATED;
              });
            }
          );
        }
      });
    });

    serviceWs.on('close', e => {
      this.emit('close');
      EmulatorWS.clearDeviceWs(this.deviceId);
      this.serviceWsMap.delete(service);
      EmulatorWS.sendReadyConnectedDevices();
    });
    EmulatorWS.sendReadyConnectedDevices();
  }

  async sendUpdateCode(cb?: (errs: string[]) => void) {
    this.status = EmulatorStatus.UPDATING;
    let serviceWs: WebsocketWithStream = this.serviceWsMap.get('control') as WebsocketWithStream;
    const data = await new GetFilesIndexCommand().execute({ deviceInfo: this.deviceInfo });
    this.indexFiles = data.files as FileInfoType[];
    sendChunkedMessage(
      serviceWs,
      JSON.stringify(createCommandMessage('getFiles', data)),
      false,
      err => {
        if (err) {
          this.status = EmulatorStatus.ERROR;
          ackErrorGenerator('Error while sending "getIndex" command')(err);
        }
        console.info('Sendind Done.');
        cb && cb(err);
      }
    );
  }

  static async sendUpdateConnectedDevices(deviceInfos: DeviceInfoType[]) {
    const emuWses = WsMap.instance.getAllDeviceWebSockets();
    sendToIDEEmulatorsAreUpdating(emuWses);
    let doneCount = 0;
    const done = err => {
      ++doneCount;
      if (err || doneCount === emuWses.length) {
        setTimeout(() => {
          sendToIDEEmulatorsAreUpdated(emuWses, err);
        }, 2000);
      }
    };
    emuWses.forEach(e => e.sendUpdateCode(done));
  }

  static async sendReadyConnectedDevices() {
    sendToIDEEmulatorsAreReady(WsMap.instance.getAllDeviceWebSockets());
  }
}
/*

node ./lib/index.js --rootPath /Users/SMARTFACE/Desktop/son_boiler --bypasssecuritycheck --port 52200 --host 0.0.0.0  
*/
