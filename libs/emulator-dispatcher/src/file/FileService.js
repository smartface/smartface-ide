const path = require('path');
const fs = require('fs');
const gc = require('js-gc');
const URIParser = require('./URIParser');
const FileTransfer = require('./FileTransfer');
const FilePackager = require('./FilePackager');
const ProjectChecker = require('../common/ProjectChecker');
const MessageFactory = require('../common/MessageFactory');
const LogToConsole = require('../common/LogToConsole');
const errorMessages = require('../common/errorMessages');
const sendResetTimeout = require('../common/sendResetTimeout');
const isEmptyObject = require('../common/isEmptyObject');
const CONSTANTS = require('../constants');
const join = require('../util/join');

function FileService() {
  const DEVICE = 'device';
  const MESSAGE = 'message';
  const DEBUGGER = 'debugger';
  const DISPATCHER = 'dispatcher';
  const UI = 'UI';
  const CONTROL = 'control';
  const IDLE = 1;
  const SENDING = 2;

  const self = this;
  const messageFactory = new MessageFactory();
  let bypassSecurityCheck;
  let logToConsole;
  let log;
  let debug;

  this.emit = null;
  this.callbackList = {};
  this.ws = null;
  this.connectedDeviceType = '';
  this.basePaths = {
    iOS: {},
    Android: {}
  };
  let logger;

  this.init = function (emitFunction, opts) {
    opts = opts || {};
    logToConsole = opts.logToConsole;
    bypassSecurityCheck = opts.bypassSecurityCheck;
    logger = new LogToConsole(logToConsole, '[FILE]');
    debug = logger.debug;
    log = logger.log;

    if (!emitFunction) {
      throw new Error('Required parameters are missing!');
    }
    self.emit = emitFunction;
    self.ws = opts.data.ws;
    self.getProjectPaths();
    log('FileService init');
  };

  this.replaceWebsocket = function (ws) {
    self.ws = ws;
  };

  this.getProjectPaths = function () {
    const workspaceDir = CONSTANTS.WORKSPACE_PATH;
    const content = fs.readFileSync(join(workspaceDir, 'config', 'project.json'), 'utf8');
    try {
      const project = JSON.parse(content);
      self.basePaths.iOS.scripts = join(workspaceDir, project.build.input.ios.scripts);
      self.basePaths.iOS.images = join(workspaceDir, project.build.input.ios.images);
      self.basePaths.iOS.assets = join(workspaceDir, project.build.input.ios.assets);
      self.basePaths.iOS.fonts = join(workspaceDir, 'config', 'Fonts');
      self.basePaths.iOS.config = join(workspaceDir, 'config');
      self.basePaths.Android.scripts = join(workspaceDir, project.build.input.android.scripts);
      self.basePaths.Android.images = join(workspaceDir, project.build.input.android.images);
      self.basePaths.Android.assets = join(workspaceDir, project.build.input.android.assets);
      self.basePaths.Android.fonts = join(workspaceDir, 'config', 'Fonts');
      self.basePaths.Android.config = join(workspaceDir, 'config');
      log('Received project paths');
    } catch (e) {
      log('[ERROR]', e);
      process.exit('config/project.json does not exist or is broken');
    }
  };

  this.handleMessage = function (from, message) {
    log('Handle message from', from, 'message : ', message.command);
    if (self.callbackList[message.id]) {
      self.callbackList[message.id](message);
    }
    switch (true) {
      case message.command === 'getFiles':
        var { allUIWebsockets } = global.shared;
        var { allWebsockets } = global.shared;
        var { connectedObject } = allWebsockets[message.__deviceId];
        var isBrowserActive = connectedObject && allUIWebsockets[connectedObject.browserGuid];
        /// /////////////////////////////////////
        if (!connectedObject) {
          log("\n\ndevice is missing, allWebsocket ID's =>");
          for (var key in allWebsockets) {
            log(key);
          }
          log('\ndeviceId : ', message.__deviceId);
          log('\nend of device\n\n');
        }
        if (!isBrowserActive) {
          log("\n\nbrowser is missing, allUIWebsocket ID's =>");
          for (var key in allUIWebsockets) {
            log(key);
          }
          log('\ndeviceId : ', message.__deviceId);
          log('\nend of browser\n\n');
        }
        /// /////////////////////////////////////

        // if (!isBrowserActive && !bypassSecurityCheck) {
        //	self.sendMessage(CONTROL, 'cancelTransfer',
        //		messageFactory.createMessage('cancelTransfer', {
        //			errorMessage: errorMessages.IDE_CLOSED
        //		}));
        // }
        // else {
        new ProjectChecker(logToConsole).check(
          CONSTANTS.WORKSPACE_PATH,
          (err, cliErrReport, errors, warnings) => {
            const shouldShowErrorsOnUI = (err || errors || warnings);
            const shouldShowErrorsOnDevice = (err || errors);
            const shouldSendFiles = !shouldShowErrorsOnDevice;

            !isEmptyObject(err) && log('[ERROR]', JSON.stringify(err));
            !isEmptyObject(cliErrReport) && log('[ERROR]', JSON.stringify(cliErrReport));
            !isEmptyObject(errors) && log('[ERROR]', JSON.stringify(errors));
            !isEmptyObject(warnings) && log('[ERROR]', JSON.stringify(warnings));

            if (shouldSendFiles) {
              self.getFiles(message);
            }
            if (shouldShowErrorsOnUI) {
              self.sendMessage(UI, 'showErrors',
                messageFactory.createMessage('showErrors', cliErrReport));
            }
            if (shouldShowErrorsOnDevice) {
              log('cancelTransfer', cliErrReport);
              self.sendMessage(CONTROL, 'cancelTransfer',
                messageFactory.createMessage('cancelTransfer', {
                  errorMessage: errorMessages.CANCEL_TRANSFER
                }));
            }
          }
        );
        // }
        break;
      case message.event === 'deviceInfo':
        self.connectedDeviceType = message.deviceInfo.os;
        log('deviceInfo event, connectedDeviceType:', self.connectedDeviceType);
        break;
      default:
    }
  };

  this.getFiles = function (message) {
    const deviceID = message.__deviceId;
    sendResetTimeout.set(deviceID, () => {
      self.sendMessage(DEVICE, 'resetTimeout',
        messageFactory.createMessage('resetTimeout'));
    });
    sendRequestedFiles(message, (err) => {
      err && log(err);
      !err && log('File sent');
      sendResetTimeout.clear(deviceID);
    });
  };

  this.sendMessage = function (to, command, message, callback) {
    if (callback) {
      self.callbackList[message.id] = callback;
    }
    self.emit(MESSAGE, to, command, message);
  };

  function sendRequestedFiles(requestMessage, callback) {
    const isIOS = self.connectedDeviceType === 'iOS';
    const basePaths = self.basePaths[isIOS ? 'iOS' : 'Android'];
    let filePackager = new FilePackager();
    const { indexData } = global.shared.allDeviceInfos[requestMessage.__deviceId];
    requestMessage.data.files.forEach((file) => {
        const filePath = (indexData.files[file] && indexData.files[file].fullPath) || URIParser.findFilePath(basePaths, file);
        const info = URIParser.parse(file, isIOS);
        filePackager.addFile(filePath, info.fileName, info.fileNameWithSchema);
    });

    filePackager.finalize((err, data) => {
      if (err) {
        return callback(`**ERROR** Finalizing package have failed: ${err}`);
      }
      FileTransfer.sendFileOverWS(self.ws, data, logToConsole, (err) => {
        // Cleanup
        filePackager.destroy();
        filePackager = null;
        data = null;
        gc();

        return callback(err && `**ERROR** ${err}`);
      });
    });
  }
}

module.exports = FileService;
