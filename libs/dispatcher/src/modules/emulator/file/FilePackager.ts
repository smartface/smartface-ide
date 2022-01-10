const fs = require('fs');
const async = require('async');
import Zipper from './Zipper';
import DescriptorFile from './DescriptorFile';
import LogToConsole from '../../shared/LogToConsole';

export default class FilePackager {
  private zipper: Zipper;
  private descriptor: DescriptorFile;
  logger: LogToConsole;
  private fileMap: { [key: string]: { fileName: string; fileNameWithType: string } };

  constructor() {
    this.zipper = new Zipper();
    this.descriptor = new DescriptorFile();
    this.logger = LogToConsole.instance;
    this.fileMap = {};
  }

  addFile(fullPath: string, fileName: string, fileNameWithType: string) {
    this.fileMap[fullPath] = {
      fileName: fileName,
      fileNameWithType: fileNameWithType,
    };
  }

  finalize(callback) {
    const queue = async.queue((fullPath, cb) => {
      var fileName = this.fileMap[fullPath].fileName;
      fs.readFile(fullPath, (err, data) => {
        if (err) {
          this.logger.warn("**ERROR** Couldn't add file", fullPath);
        } else {
          this.descriptor.add(fileName, this.fileMap[fullPath].fileNameWithType);
          this.zipper.add(fileName, data);
        }
        cb();
      });
    }, 20);

    queue.drain = () => {
      this.zipper.add(DescriptorFile.FILE_NAME, this.descriptor.toString());
      this.zipper.createZip().then(callback.bind(null, null), callback);
    };

    queue.push(Object.keys(this.fileMap));
  }

  destroy() {
    this.zipper.clear();
    this.descriptor = null;
    this.fileMap = {};
  }
}
