import Command from '../../../core/Command';
import { DeviceInfoType } from '../../../core/CommandTypes';
import { WorkspaceIndexType } from '../../../core/WorkspaceIndexTypes';
import { ConfigurationService } from '../../shared/ConfigurationService';
import Workspace from '../../shared/workspace/workspace';

export default class GetFilesIndexCommand implements Command<any> {
    async execute(opts?: { deviceInfo: DeviceInfoType }): Promise<WorkspaceIndexType> {
        const workspace = new Workspace({
            path: ConfigurationService.instance.getWorkspacePath(),
            projectID: ''
        });
        return new Promise((resolve, reject) => {
            console.info('Get workspace.getIndex ...');
            workspace.getIndex(opts.deviceInfo, (err, indexData) => {
                if (err) {
                    return reject(err);
                }
                resolve(indexData);
            });
        });
    }
}
