import { OSType } from '../../../core/CommandTypes';
import { FileInfoType } from '../../../core/WorkspaceIndexTypes';
import { ConfigurationService } from '../../shared/ConfigurationService';
import FilePackager from './FilePackager';
import { findFilePath, parse } from './URIParser';

export function getFilesData(options: { files: string[]; os: OSType, indexFiles: FileInfoType[] }): Promise<Buffer> {
    const { os, files, indexFiles } = options;
    const isIOS = os === 'iOS';
    const basePaths = ConfigurationService.instance.getProjectPaths()[os];
    const filePackager = new FilePackager();
    files.forEach(file => {
        const filePath = (indexFiles[file] && indexFiles[file].fullPath) || findFilePath(basePaths, file);
        var info = parse(file, isIOS);
        filePackager.addFile(filePath, info.fileName, info.fileNameWithSchema);
    });
    return new Promise((resolve, reject) => {
        filePackager.finalize((err, data) => {
            if (err) {
                return reject('**ERROR** Finalizing package have failed: ' + err);
            } else {
                resolve(data);
            }
        });
    });
}
