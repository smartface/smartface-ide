import Command from '../../../core/Command';
import Workspace = require('smartfacecloud-emulator-index');
import { ConfigurationService } from '../../shared/ConfigurationService';

export default class GetFilesIndexCommand implements Command<any> {
  async execute(opts?: { deviceInfo: any }): Promise<any> {
    const workspace = new Workspace({
      path: ConfigurationService.instance.getWorkspacePath(),
    });
    return new Promise((resolve, reject) => {
      workspace.getIndex(opts.deviceInfo, function(err, indexData) {
        if (err) {
          return reject(err);
        }
        resolve(indexData);
      });
    });
  }
}
