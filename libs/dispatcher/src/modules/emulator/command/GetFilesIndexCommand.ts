import Command from '../../../core/Command';
import { DeviceInfoType } from '../../../core/CommandTypes';
import { WorkspaceIndexType } from '../../../core/WorkspaceIndexTypes';
import { ConfigurationService } from '../../shared/ConfigurationService';
import Device from '../../shared/workspace/device';
import Workspace from '../../shared/workspace/workspace';
import WsMap from '../../shared/WsMap';

export default class GetFilesIndexCommand implements Command<any> {
  async execute(opts?: { deviceInfo: DeviceInfoType }): Promise<WorkspaceIndexType> {
    const emuWs = WsMap.instance.getDeviceWebSocket(opts.deviceInfo.deviceID);
    if (!emuWs.workspace) {
      emuWs.workspace = new Workspace({
        securityGuid: emuWs.securityGuid,
        path: ConfigurationService.instance.getWorkspacePath(),
        projectID: '',
        device: new Device(opts.deviceInfo)
      });
    }
    return emuWs.workspace.getIndex();
  }
}
