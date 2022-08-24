import WebSocket = require('ws');
import EventEmitter = require('events');
import { isConsoleCommands } from '../../core/connection';
import LogToConsole from '../shared/LogToConsole';
import WsMap from '../shared/WsMap';
import parseEachJSON = require('ws-json-organizer');
import { sendToIDEWebSocket } from '../ide';
import GetFilesIndexCommand from './command/GetFilesIndexCommand';
import sendChunkedMessage, { WebsocketWithStream } from '../shared/util/sendChunkedMessage';
import createCommandMessage from '../shared/util/createCommandMessage';
import GetFilesDataCommand from './command/GetFilesDataCommand';
import {
  CommandType,
  ConsoleCommandType,
  DeviceInfoType,
  GetFilesCommandType,
  GetIndexCommandType,
  UpdateCommandType
} from '../../core/CommandTypes';
import { FileInfoType } from '../../core/WorkspaceIndexTypes';
import { sendReadyConnectedDevices } from './emulator-manager';
import iOSMap from '../shared/workspace/iosmap';
import { ConfigurationService } from '../shared/ConfigurationService';
import { mkdirpSync } from '../shared/util/mkdirp';
import Workspace from '../shared/workspace/workspace';

export enum EmulatorStatus {
  READY = 'READY',
  UPDATING = 'UPDATING',
  UPDATED = 'UPDATED',
  ERROR = 'ERROR',
  NOCHANGES = 'NOCHANGES'
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
  public workspace: Workspace;
  private udpatingTimeoutTimer: NodeJS.Timeout;
  private logger: LogToConsole;
  private serviceWsMap: Map<string, WebSocket>;
  public deviceInfo: DeviceInfoType;
  private indexFiles: FileInfoType[] = [];
  private _status: EmulatorStatus;
  private sentCrcSum: string = 'empty';
  private readyCrcSum: string = 'empty';
  public set status(_status: EmulatorStatus) {
    this._status = _status;
    this.emit('statusChange', _status);
    if (_status === EmulatorStatus.ERROR) {
      this.logger.error(this.errors.join('\n'));
    }
  }
  public get status() {
    return this._status;
  }
  public errors: string[] = [];
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

  private calculateCrcSum(indexFiles: FileInfoType[]) {
    let crcSum = '';
    Object.keys(indexFiles).forEach(key => (crcSum = crcSum + indexFiles[key].crc));
    return crcSum;
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
          this.errors.push('parseEachJSON Error', err);
          this.status = EmulatorStatus.ERROR;
          return;
        }
        this.logger.log('🤖 >> ', service, ' ws.onMessage ', this.deviceId, parsedMessage.command);
        if (parsedMessage.command && isConsoleCommands(parsedMessage.command)) {
          //TODO add deviceInfo from getIndex Command
          sendToIDEWebSocket(this.browserGuid, {
            ...(parsedMessage as ConsoleCommandType),
            connectedObject: {
              deviceId: this.deviceId,
              browserGuid: this.browserGuid,
              deviceInfo: this.deviceInfo
            }
          });
        } else if (parsedMessage.command === 'getInfo') {
          this.deviceInfo = (parsedMessage as GetIndexCommandType).data;
          this.deviceInfo.isOverUSB = this.isOverUSB;
          this.deviceInfo.brandModel =
            iOSMap[this.deviceInfo.brandModel] || this.deviceInfo.brandModel;
          EmulatorWS.deviceInfos.set(this.deviceId, this.deviceInfo);
          sendReadyConnectedDevices();
        } else if (parsedMessage.command === 'getIndex') {
          this.deviceInfo = (parsedMessage as GetIndexCommandType).data;
          this.deviceInfo.isOverUSB = this.isOverUSB;
          this.deviceInfo.brandModel =
            iOSMap[this.deviceInfo.brandModel] || this.deviceInfo.brandModel;
          EmulatorWS.deviceInfos.set(this.deviceId, this.deviceInfo);
          sendReadyConnectedDevices();
          this.sendUpdateCode(false);
        } else if (parsedMessage.command === 'getFiles') {
          if (this.udpatingTimeoutTimer) {
            clearTimeout(this.udpatingTimeoutTimer);
          }
          const zipData = await new GetFilesDataCommand().execute({
            os: this.deviceInfo.os,
            files: (parsedMessage as GetFilesCommandType).data.files,
            indexFiles: this.indexFiles
          });
          sendChunkedMessage(
            serviceWs,
            JSON.stringify(
              createCommandMessage('fileSize', {
                size: zipData.byteLength
              })
            ),
            false,
            (err, result) => {
              if (err) {
                this.errors.push('**ERROR** An error occured while sending the size of the file');
                this.status = EmulatorStatus.ERROR;
              } else {
                sendChunkedMessage(serviceWs, zipData, true, (err, result) => {
                  if (err) {
                    this.errors.push(
                      '**ERROR** An error occured while sending the zip data of files'
                    );
                    this.status = EmulatorStatus.ERROR;
                  } else {
                    this.sentCrcSum = this.readyCrcSum;
                    console.info('📦 Sendind Done.');
                    //this.status = EmulatorStatus.UPDATED;
                  }
                });
              }
            }
          );
        } else if (parsedMessage.command === 'onUpdateStarted') {
          const data = (parsedMessage as UpdateCommandType).data;
          if (data === 'no-update') {
            this.status = EmulatorStatus.NOCHANGES;
          }
        } else if (parsedMessage.command === 'onUpdateFinished') {
          if (this._status === EmulatorStatus.UPDATING) {
            this.status = EmulatorStatus.UPDATED;
          }
          if (this.udpatingTimeoutTimer) {
            clearTimeout(this.udpatingTimeoutTimer);
          }
        }
      });
    });

    serviceWs.on('close', e => {
      //this.emit('close');
      EmulatorWS.clearDeviceWs(this.deviceId);
      if (this.workspace) {
        this.workspace.stopWatcher();
      }
      this.serviceWsMap.delete(service);
      this._status = EmulatorStatus.READY;
      sendReadyConnectedDevices();
    });
    if (this.deviceInfo) {
      sendReadyConnectedDevices();
    }
  }

  async sendUpdateCode(isTriggerViaIDE: boolean = false, cb?: (errs: string[]) => void) {
    this.status = EmulatorStatus.UPDATING;
    let serviceWs: WebsocketWithStream = this.serviceWsMap.get('control') as WebsocketWithStream;
    console.time('⏳ --GGettingindex' + this.deviceInfo.deviceID);
    const data = await new GetFilesIndexCommand().execute({ deviceInfo: this.deviceInfo });
    const files = data.files as FileInfoType[];
    this.readyCrcSum = this.calculateCrcSum(files);
    //------ws.json debug -------//
    const fs = require('fs');
    const path = require('path');
    mkdirpSync(ConfigurationService.instance.getTempPath());
    fs.writeFile(
      path.join(ConfigurationService.instance.getTempPath(), 'ws_diff.json'),
      JSON.stringify(data, null, '\t'),
      () => {
        console.log('🔖 ', ConfigurationService.instance.getTempPath(), ' - diff writing done.');
      }
    );
    //------ws.josn debug end-------//
    console.timeEnd('⏳ --GGettingindex' + this.deviceInfo.deviceID);
    if (this.sentCrcSum === this.readyCrcSum && isTriggerViaIDE) {
      this.status = EmulatorStatus.NOCHANGES;
      return;
    }
    this.indexFiles = files;
    sendChunkedMessage(
      serviceWs,
      JSON.stringify(createCommandMessage('getFiles', data)),
      false,
      err => {
        if (err) {
          this.errors.push('Error while sending "getIndex" command', err.join(','));
          this.status = EmulatorStatus.ERROR;
          cb && cb(err);
        } else {
          console.info('📦 Sendind Done.');
          cb && cb(null);
          this.udpatingTimeoutTimer = setTimeout(() => {
            this.status = EmulatorStatus.NOCHANGES;
          }, 15000);
        }
      }
    );
  }
}
/*

node ./lib/index.js --rootPath /Users/SMARTFACE/Desktop/son_boiler --bypasssecuritycheck --port 52200 --host 0.0.0.0  
*/
