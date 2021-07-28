module.exports = function () {
  const self = this;
  this.map = {};

  this.add = function (key, value) {
    self.map[key] = value;
  };

  this.toString = function () {
    let data = '';
    for (const key in self.map) {
      data += `${key} ${self.map[key]}\n`;
    }
    return data;
  };

  this.FILE_NAME = 'descriptor.txt';
};
