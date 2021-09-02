const uuid = require('uuid');
const SendChunkedMessage = require('../common/SendChunkedMessage');
const LogToConsole = require('../common/LogToConsole');

const MAX_BUFFER = 100000;

function sendFileOverWS(ws, data, logToConsole, callback) {
  const { log } = new LogToConsole(logToConsole, '[FILE]');
  const sendMessageService = new SendChunkedMessage(logToConsole);
  let fileInfo = {
    id: uuid.v4(),
    command: 'fileSize',
    data: {
      size: data.byteLength
    }
  };

  fileInfo = JSON.stringify(fileInfo, null, '\t');
  sendMessageService.send(ws, fileInfo, (err, result) => {
    if (err) {
      log('[ERROR] An error occured while sending the size of the file');
      return callback(err);
    }
    log('File size sent', fileInfo);
    sendMessageService.send(ws, data, true, (err, result) => {
      if (err) return callback(err);
      if (result) return callback(null, result);
    });
  });
}

module.exports = {
  sendFileOverWS
};
