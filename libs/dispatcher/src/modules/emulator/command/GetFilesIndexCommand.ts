import Command from '../../../core/Command';
import { DeviceInfoType } from '../../../core/CommandTypes';
import { WorkspaceIndexType } from '../../../core/WorkspaceIndexTypes';
import { ConfigurationService } from '../../shared/ConfigurationService';
import Device from '../../shared/workspace/device';
import Workspace from '../../shared/workspace/workspace';

export default class GetFilesIndexCommand implements Command<any> {
    async execute(opts?: { deviceInfo: DeviceInfoType }): Promise<WorkspaceIndexType> {
        const workspace = new Workspace({
            path: ConfigurationService.instance.getWorkspacePath(),
            projectID: ''
        });
        return workspace.getIndex(new Device(opts.deviceInfo));
    }
}
