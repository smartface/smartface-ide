import JSZip = require('jszip');

export default class Zipper {
  private zip: JSZip;

  constructor() {
    this.zip = new JSZip();
  }

  has(fileName: string) {
    return this.zip.file(fileName) !== null;
  }

  add(fileName: string, content: string) {
    this.zip.file(fileName, content);
    return this;
  }

  remove(filePath: string) {
    this.zip.remove(filePath);
    return this;
  }

  clear() {
    this.zip = new JSZip();
  }

  async createZip() {
    return this.zip.generateAsync({
      type: 'nodebuffer',
      platform: 'UNIX',
    });
  }
}
