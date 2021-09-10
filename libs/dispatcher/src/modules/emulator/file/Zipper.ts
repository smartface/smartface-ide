import JSZip = require('jszip');

export default class Zipper {
  private zip: JSZip;

  constructor() {
    this.zip = new JSZip();
  }

  has(fileName: string) {
    return this.zip.file(fileName) !== null;
  }

  add(fileName: string, content: string): Zipper {
    this.zip.file(fileName, content);
    return this;
  }

  remove(filePath: string): Zipper {
    this.zip.remove(filePath);
    return this;
  }

  clear() {
    this.zip = new JSZip();
  }

  async createZip(): Promise<Buffer> {
    return this.zip.generateAsync({
      type: 'nodebuffer',
      platform: 'UNIX',
    });
  }
}
