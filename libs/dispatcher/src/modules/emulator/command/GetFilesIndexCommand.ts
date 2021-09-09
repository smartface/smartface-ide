import Command from '../../../core/Command';
import { ConfigurationService } from '../../shared/ConfigurationService';
import Workspace from '../../shared/workspace/workspace';

export default class GetFilesIndexCommand implements Command<any> {
    async execute(opts?: { deviceInfo: any }): Promise<any> {
        const workspace = new Workspace({
            path: ConfigurationService.instance.getWorkspacePath(),
            projectID: ''
        });
        return new Promise((resolve, reject) => {
            console.info('Get workspace.getIndex ...');
            workspace.getIndex(opts.deviceInfo, (err, indexData) => {
                console.error('ERRRRRR Index ', err, indexData.files);
                if (err) {
                    return reject(err);
                }
                resolve(indexData);
            });
        });
    }
}
