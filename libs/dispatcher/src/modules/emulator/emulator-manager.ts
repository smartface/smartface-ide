import { DeviceInfoType } from '../../core/CommandTypes';
import {
  sendToIDEEmulatorsAreReady,
  sendToIDEEmulatorsAreUpdated,
  sendToIDEEmulatorsAreUpdating,
} from '../ide';
import WsMap from '../shared/WsMap';
import { EmulatorStatus } from './EmulatorWS';

export async function sendUpdateConnectedDevices(deviceInfos: DeviceInfoType[]) {
  const emuWses = deviceInfos
    .map(d => WsMap.instance.getDeviceWebSocket(d.deviceID))
    .filter(emu => emu && emu.status !== EmulatorStatus.UPDATING);
  if (emuWses.length === 0 || emuWses.some(f => !f)) {
    return sendToIDEEmulatorsAreUpdated(
      emuWses.map(emu => emu.deviceInfo),
      [],
      deviceInfos
        .filter(d => !WsMap.instance.getDeviceWebSocket(d.deviceID))
        .map(d => ({ ...d, errors: ['No connected device found!'] }))
    );
  }
  sendToIDEEmulatorsAreUpdating(deviceInfos);
  let doneCount = 0;
  let noChangesDeviceInfos: DeviceInfoType[] = [];
  let updatedDeviceInfos: DeviceInfoType[] = [];
  let errorDeviceInfos: (DeviceInfoType & { errors: string[] })[] = [];
  let errors: string[] = [];
  emuWses.forEach(emuWs => {
    const onStatusChange = (status: EmulatorStatus) => {
      if (emuWs.status === EmulatorStatus.ERROR) {
        ++doneCount;
        errors = errors.concat(emuWs.errors);
        errorDeviceInfos.push({ ...emuWs.deviceInfo, errors: emuWs.errors });
        emuWs.off('statusChange', onStatusChange);
      } else if (emuWs.status === EmulatorStatus.UPDATED) {
        ++doneCount;
        emuWs.off('statusChange', onStatusChange);
        updatedDeviceInfos.push(emuWs.deviceInfo);
      } else if (emuWs.status === EmulatorStatus.NOCHANGES) {
        ++doneCount;
        emuWs.off('statusChange', onStatusChange);
        noChangesDeviceInfos.push(emuWs.deviceInfo);
      }
      if (doneCount === emuWses.length) {
        sendToIDEEmulatorsAreUpdated(updatedDeviceInfos, noChangesDeviceInfos, errorDeviceInfos);
      }
    };
    emuWs.on('statusChange', onStatusChange);
  });
  emuWses.forEach(e => e.sendUpdateCode(true));
}

export async function sendReadyConnectedDevices() {
  sendToIDEEmulatorsAreReady(
    WsMap.instance
      .getAllDeviceWebSockets()
      .map(i => i.deviceInfo)
      .filter(d => !!d)
  );
}