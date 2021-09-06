const Workspace = require('../workspace/workspace');
const uuid = require('uuid');
const MessageFactory = require('../common/MessageFactory');
const debugSession = require('../debug/debugsession.js');
const LogToConsole = require('../common/LogToConsole');
const sendResetTimeout = require('../common/sendResetTimeout');
const CONSTANTS = require('../constants');

function ControlService() {
  const UI = 'UI';
  const DEVICE = 'device';
  const MESSAGE = 'message';
  const FILE_TRANSFER = 'file-transfer';
  const DEBUGGER = 'debugger';
  const ALL = '*';
  const waitForSync = true;
  const messageFactory = new MessageFactory();

  let workspace = null;
  let request;
  const callbackList = {};
  const self = this;
  let log;
  let debug;
  this.request = null;
  this.deviceInfo = null;

  this.init = function (requestService, opts) {
    opts = opts || {};
    const logger = new LogToConsole(opts.logToConsole, '[CONTROL]');
    log = logger.log;
    debug = logger.debug;
    request = requestService;
    getWorkspaceOptions();
  };

  this.handleMessage = function (from, message) {
    log('Handle message from', from);
    if (callbackList[message.id]) {
      callbackList[message.id](null, message);
    } else {
      if (message.event) {
        if (message.event === 'fileTransferCompleted') {
          self.start('Project');
        } else if (message.event === 'switchedProject') {
          self.init(request);
        }
      }

      if (message.command) {
        if (message.command === 'pingDevice') {
          self.ping();
        } else if (message.command === 'getIndex') {
          self.deviceInfo = message.data;
          global.shared.allDeviceInfos[self.deviceInfo.deviceID] = self.deviceInfo;

          sendRequest(ALL, null, {
            event: 'deviceInfo',
            deviceInfo: self.deviceInfo
          });
          if (workspace == null) {
            getWorkspaceOptions((err, received) => {
              if (err) throw err;

              self.sendIndex();
            });
          } else {
            self.sendIndex();
          }
        } else if (message.command === 'cancelTransfer') {
          const messageToDevice = {};
          messageToDevice.errors = [];
          messageToDevice.warnings = [];
          messageToDevice.errors.push(message.data.errorMessage);
          sendRequest(DEVICE, null, messageFactory.createMessage(
            'cancelTransfer', messageToDevice
          ));
        } else if (message.command === 'stop project') {
          const responseMessage = messageFactory.createMessage('stop project', {
            responseID: uuid.v4()
          });
          sendRequest(UI, null, responseMessage);
        } else if (message.command === 'resetTimeout') {
          sendRequest(DEVICE, null, messageFactory.createMessage(message.command));
        }
      }
    }
  };

  function getWorkspaceOptions(callback) {
    log('Received workspace options');
    const received = {
      path: CONSTANTS.WORKSPACE_PATH,
      projectID: process.env.C9_HOSTNAME
    };
    workspace = new Workspace({
      path: received.path,
      projectID: received.projectID
    });
    if (callback) {
      callback(null, received);
    }
  }

  // Commands

  this.sendIndex = function () {
    log('sendIndex');

    const { deviceID } = this.deviceInfo;

    try {
      sendResetTimeout.set(deviceID, () => {
        sendRequest(DEVICE, 'resetTimeout',
          messageFactory.createMessage('resetTimeout'));
      });
      workspace.getIndex(self.deviceInfo, (err, indexData) => {
        sendResetTimeout.clear(deviceID);
        global.shared.allDeviceInfos[self.deviceInfo.deviceID].indexData = indexData;
        sendRequest(DEVICE, null, messageFactory.createMessage('getFiles', indexData));
      });
    } catch (ex) {
      sendResetTimeout.clear(deviceID);
      sendRequest(DEVICE, null, messageFactory.createMessage('getFiles', null));
    }
  };

  this.start = function (type) {
    log('start');
    const message = messageFactory.createMessage('start', type);
    sendRequest(DEVICE, null, message);
  };

  this.stop = function (type) {
    log('stop');
    const message = messageFactory.createMessage('stop', type);
    sendRequest(DEVICE, null, message);
  };

  this.erase = function () {
    log('erase');
    const message = messageFactory.createMessage('erase');
    sendRequest(DEVICE, null, message);
  };

  this.ping = function () {
    log('ping');
    const message = messageFactory.createMessage('ping');
    sendRequest(DEVICE, null, message);
  };

  this.openUrl = function (url) {
    log('openUrl');
    const message = messageFactory.createMessage('openUrl', {
      url
    });
    sendRequest(DEVICE, null, message);
  };

  // Communication

  function sendRequest(to, command, message, callback) {
    if (callback) {
      callbackList[message.id] = callback;
    }
    request(MESSAGE, to, command, message);
  }
}

module.exports = ControlService;
