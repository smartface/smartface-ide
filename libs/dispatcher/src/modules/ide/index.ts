import WsMap from '../shared/WsMap';
import WebSocket = require('ws');
import uuid = require('uuid');
import parseEachJSON = require('ws-json-organizer');
import { ConsoleCommandType, DeviceInfoType, EmulatorCommandType } from '../../core/CommandTypes';
import { EmulatorWS } from '../emulator/EmulatorWS';

export function initIDEWebSocket(browserGuid: string, ws: WebSocket) {
  WsMap.instance.setIDEWebSocket(browserGuid, ws);
  ws.on('message', msg =>
    parseEachJSON(msg.toString(), async (err, parsedMessage: EmulatorCommandType) => {
      console.info('Get Command UI_WS >> ', parsedMessage.command);
      if (parsedMessage.command === 'emulators_update') {
        EmulatorWS.sendUpdateConnectedDevices(parsedMessage.data.deviceInfos);
      }
    })
  );
}

export function removeIDEWebSocket(browserGuid: string) {
  WsMap.instance.delIDEWebSocket(browserGuid);
}

export function hasAlreadyInitIDEWebSocket(browserGuid: string) {
  return !!WsMap.instance.getIDEWebSocket(browserGuid);
}

function getIdeWebSocket(browserGuid: string) {
  const ws = WsMap.instance.getIDEWebSocket(browserGuid);
  if (ws && ws.readyState === WebSocket.OPEN) {
    return ws;
  }
  return null;
}

export function sendToIDEWebSocket(
  browserGuid: string,
  parsedMessage:
    | (ConsoleCommandType & {
        connectedObject: { browserGuid: string; deviceId: string; deviceInfo: DeviceInfoType };
      })
    | EmulatorCommandType
) {
  const ws = getIdeWebSocket(browserGuid);
  if (ws) {
    ws.send(JSON.stringify(parsedMessage));
  } else {
    const itrIdeWs = WsMap.instance.getAllIDEWebSocket();
    while (itrIdeWs) {
      const val = itrIdeWs.next();
      if (val.done) {
        return;
      }
      const wsItem = val.value;
      if (wsItem.readyState === WebSocket.OPEN) {
        wsItem.send(JSON.stringify(parsedMessage));
      }
    }
  }
}

export function sendToIDEEmulatorsAreReady(deviceInfos: DeviceInfoType[]) {
  sendToIDEWebSocket('sendAll', {
    id: uuid.v4(),
    command: 'emulators_ready',
    data: {
      deviceInfos,
    },
  });
}

export function sendToIDEEmulatorsAreUpdating(deviceInfos: DeviceInfoType[]) {
  sendToIDEWebSocket('sendAll', {
    id: uuid.v4(),
    command: 'emulators_updating',
    data: {
      deviceInfos,
    },
  });
}

export function sendToIDEEmulatorsAreUpdated(
  updatedDeviceInfos: DeviceInfoType[],
  noChangesDeviceInfos: DeviceInfoType[],
  errorDeviceInfos: DeviceInfoType[]
) {
  sendToIDEWebSocket('sendAll', {
    id: uuid.v4(),
    command: 'emulators_updated',
    data: {
      message: 'Emulators updated.',
      updatedDeviceInfos,
      noChangesDeviceInfos,
      errorDeviceInfos,
    },
  });
}
