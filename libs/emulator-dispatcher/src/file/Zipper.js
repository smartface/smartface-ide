const JSZip = require('jszip');

const Zipper = function () {
  this.zip = new JSZip();
};

Zipper.prototype.has = function (fileName) {
  return this.zip.file(fileName) !== null;
};

Zipper.prototype.add = function (fileName, content) {
  this.zip.file(fileName, content);
  return this;
};

Zipper.prototype.remove = function (filePath) {
  this.zip.remove(filePath);
  return this;
};

Zipper.prototype.createZip = function () {
  return this.zip.generateAsync({
    type: 'nodebuffer',
    platform: 'UNIX'
  });
};

module.exports = Zipper;
