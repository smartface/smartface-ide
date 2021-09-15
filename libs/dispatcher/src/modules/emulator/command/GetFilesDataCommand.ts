import Command from '../../../core/Command';
import { OSType } from '../../../core/CommandTypes';
import { getFilesData } from '../file/FileTransferService';

export default class GetFilesDataCommand implements Command<any> {
    async execute(opts: { files: any[]; os: OSType, indexFiles: any[] }): Promise<Buffer> {
        return await getFilesData(opts);
    }
}
