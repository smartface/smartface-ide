const FileService = require('./FileService');

function Service() {
  const FILE_SERVICE = 'file-transfer';
  const self = this;

  this.eventEmitter = null;
  this.fileService = new FileService();

  this.init = function (emitter, opts) {
    if (!emitter) {
      throw new Error('Required parameters are missing');
    }

    if (self.eventEmitter) {
      self.eventEmitter.removeListener('message', onMessage);
    }

    self.eventEmitter = emitter;
    self.eventEmitter.on('message', onMessage);
    self.fileService.init(emit, opts);
  };

  this.replaceWebsocket = function (ws) {
    self.fileService.replaceWebsocket(ws);
  };

  function onMessage(data) {
    if (skip(data.meta)) {
      return;
    }
    data.data.__deviceId = data.meta.deviceId;
    self.fileService.handleMessage(data.meta.from, removeMeta(data));
  }

  function addMeta(to, command, message) {
    const messageWithMeta = {
      meta: {
        from: FILE_SERVICE,
        to,
        command
      },
      data: message
    };
    return messageWithMeta;
  }

  function removeMeta(data) {
    return data.data;
  }

  function skip(meta) {
    if (meta.from === FILE_SERVICE) {
      return true;
    }
    if (meta.to === FILE_SERVICE || meta.to === '*') {
      return false;
    }
    return true;
  }

  function emit(event, to, command, message) {
    self.eventEmitter.emit(event, addMeta(to, command, message));
  }
}

module.exports = Service;
