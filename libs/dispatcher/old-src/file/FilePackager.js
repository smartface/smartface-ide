const fs = require('fs');
const async = require('async');
const Zipper = require('./Zipper');
const DescriptorFile = require('./DescriptorFile');
const LogToConsole = require('../common/LogToConsole');

function FilePackager() {
  let zipper = new Zipper();
  let descriptor = new DescriptorFile();
  let { log, debug } = new LogToConsole(true, '[FILE]');
  let fileMap = {};

  this.addFile = function (fullPath, fileName, fileNameWithType) {

    fileMap[fullPath] = {
      fileName,
      fileNameWithType
    };
  };

  this.finalize = function (callback) {
    const queue = async.queue((fullPath, cb) => {
      const { fileName } = fileMap[fullPath];
      fs.readFile(fullPath, (err, data) => {
        if (err) {
          log("[ERROR] Couldn't add file", fullPath);
        } else {
          descriptor.add(fileName, fileMap[fullPath].fileNameWithType);
          zipper.add(fileName, data);
        }
        cb();
      });
    }, 20);

    queue.drain = function () {
      zipper.add(descriptor.FILE_NAME, descriptor.toString());
      zipper.createZip().then(callback.bind(null, null), callback);
    };

    queue.push(Object.keys(fileMap));
  };

  this.destroy = function () {
    zipper.zip = null;
    zipper = null;
    descriptor = null;
    log = null;
    fileMap = null;
  };
}

module.exports = FilePackager;
