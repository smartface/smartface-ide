import Command from '../../../core/Command';
import { getFilesData } from '../file/FileTransferService';

export default class GetFilesDataCommand implements Command<any> {
  async execute(opts: { files: string[]; os: string }): Promise<Buffer> {
    return await getFilesData(opts);
  }
}
