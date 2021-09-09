import Command from '../../../core/Command';
import { getFilesData } from '../file/FileTransferService';

export default class GetFilesDataCommand implements Command<any> {
  async execute(opts: { files: any[]; os: string, indexFiles: any[] }): Promise<Buffer> {
    return await getFilesData(opts);
  }
}
