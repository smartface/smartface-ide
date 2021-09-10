export default class DescriptorFile {
  static FILE_NAME = 'descriptor.txt';
  private map: any;

  constructor() {
    this.map = {};
  }

  add(key: string, value: string) {
    this.map[key] = value;
  }

  toString() {
    var data = '';
    for (var key in this.map) {
      data += key + ' ' + this.map[key] + '\n';
    }
    return data;
  }
}
