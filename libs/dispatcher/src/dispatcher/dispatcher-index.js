const WebSocket = require('ws');

const WebSocketServer = WebSocket.Server;
const uuid = require('node-uuid');
const { EventEmitter } = require('events');
const express = require('express');
const parseEachJSON = require('ws-json-organizer');
const ControlService = require('../control/control-index');
const FileService = require('../file/file-index');
const UIService = require('../UI/ui-index');
const httpIndexService = require('../http/http-index');
const debugSession = require('../debug/debugsession.js');
const SendChunkedMessage = require('../common/SendChunkedMessage');
const LogToConsole = require('../common/LogToConsole');
const sendResetTimeout = require('../common/sendResetTimeout');

const SERVICES = {
  CONTROL: 'control',
  FILE_TRANSFER: 'file-transfer',
  DEBUGGER: 'debugger',
  UI: 'UI'
};
const CONSOLE_COMMANDS = [
  'console.log',
  'console.error',
  'console.info',
  'console.warn'
];
const ALLOWED_SERVICES = [
  SERVICES.CONTROL,
  SERVICES.FILE_TRANSFER,
  SERVICES.DEBUGGER,
  SERVICES.UI
];

let DEBUG_WEBSOCKET;
const allWebsockets = {};
const allUIWebsockets = {};
const allDeviceInfos = {};
let sendMessageService;
let bypassSecurityCheck;
let logToConsole;
let log;

global.shared.allWebsockets = allWebsockets;
global.shared.allUIWebsockets = allUIWebsockets;
global.shared.allDeviceInfos = allDeviceInfos;
global.shared.resetTimeoutIntervals = {};

module.exports = {
  init
};
let __ui_ws;

function init(opts) {
  logToConsole = opts.meta.logToConsole;
  bypassSecurityCheck = opts.meta.bypassSecurityCheck;

  const port = opts.ports.serve.dispatcher ? opts.ports.serve.dispatcher : 8081;
  const getCombinedWSS = require('./combineWSSExpress');
  const exWSS = new getCombinedWSS(WebSocketServer, express, {
    port,
    logToConsole,
    host: opts.host
  });
  const { wss } = exWSS;

  sendMessageService = new SendChunkedMessage(logToConsole);
  httpIndexService(express, exWSS.app, { logToConsole });
  log = new LogToConsole(logToConsole).log;

  wss.on('connection', (ws) => {
    let connectedObject; let deviceId; let browserGuid; let securityGuid; let eventEmitter; let
      wsServicesParent;
    log('- New connection request');

    const urlParts = ws.upgradeReq.url.replace("//", "/").split('/');
    if (urlParts.length === 0) {
      return;
    }
    const service = urlParts[1];
    if (service === SERVICES.UI) {
      // $HOST:$PORT/UI/$BROWSER_GUID/$SECURITY_GUID
      browserGuid = urlParts[2];
      securityGuid = urlParts[3];
      deviceId = 'browser';
    } else if (urlParts.length === 3) {
      // Backward compatible fix
      // $HOST:$PORT/$SERVICE/$DEVICE_ID
      deviceId = urlParts[2];
      browserGuid = deviceId;
      securityGuid = deviceId;
    } else if (urlParts.length === 5) {
      // $HOST:$PORT/$SERVICE/$DEVICE_ID/$BROWSER_GUID/$SECURITY_GUID
      deviceId = urlParts[2];
      browserGuid = urlParts[3];
      securityGuid = urlParts[4];
    } else {
      log('[ERROR] Url pattern is not supported', ws.upgradeReq.url);
      // TODO: error handling
      return;
    }
    connectedObject = {
      deviceId,
      browserGuid,
      securityGuid
    };
    log('Trying to connect for', service, deviceId);

    if (ALLOWED_SERVICES.indexOf(service) === -1) {
      log('Terminating ws request', service);
      return ws.terminate();
    }

    const keepAliveInterval = setInterval(() => {
      ws.send(JSON.stringify({
        command: 'keepAlive',
        service
      }), (err) => {
        if (err) console.error(err);
      });
    }, 15000);

    ws.on('close', () => {
      clearInterval(keepAliveInterval);
      sendResetTimeout.clear(deviceId);
      log('Socket is closed by user');
    });

    ws.on('error', (e) => {
      log('[ERROR]', 'Socket error : ', e);
    });

    function setupUIWS() {
      eventEmitter = new EventEmitter();
      allUIWebsockets[browserGuid] = {
        connectedObject,
        eventEmitter,
        instances: {},
        initialized: [],
        ws
      };
      __ui_ws = ws;
      ws.on('close', () => {
        allUIWebsockets[browserGuid] && delete allUIWebsockets[browserGuid];
      });
      setupOnMessageEventEmitterForUI(eventEmitter, connectedObject);
    }

    function setupDeviceWS() {
      eventEmitter = new EventEmitter();
      // TODO, each deviceId can contain the browserGuid it is connected to, and can find the related websocket and eventemitter from that browserGuid
      // or that connection could be cached here as well
      // UI stuff is not written yet anyway, messages from the UI will contain deviceId if they are directed at them
      allWebsockets[deviceId] = {
        connectedObject,
        eventEmitter,
        instances: {},
        initialized: [],
        ws
      };
      setupOnMessageEventEmitterForDevice(eventEmitter, connectedObject);
    }

    if (service === SERVICES.UI) {
      if (!allUIWebsockets[browserGuid]
				|| allUIWebsockets[browserGuid].ws.readyState === WebSocket.CLOSED) {
        setupUIWS();
      }
      wsServicesParent = allUIWebsockets[browserGuid];
      if (wsServicesParent[service]
				&& wsServicesParent[service].readyState === WebSocket.OPEN) {
        log('Terminating existing websocket', service, browserGuid);
        wsServicesParent[service].terminate();
      }
      wsServicesParent[service] = ws;
      log('Connecting', service, browserGuid);
      setupConnectedWebSocketForUI(ws, service, connectedObject);
    } else {
      if (!allWebsockets[deviceId]) {
        setupDeviceWS();
      }
      wsServicesParent = allWebsockets[deviceId];
      if (wsServicesParent[service]
				&& wsServicesParent[service].readyState === WebSocket.OPEN) {
        log('Terminating existing websocket', service, deviceId);
        wsServicesParent[service].terminate();
      }
      wsServicesParent[service] = ws;
      log('Connecting', service, deviceId);
      setupConnectedWebSocketForDevice(ws, service, connectedObject);
    }
  });

  log('Ready to connect');
}

function ackErrorGenerator(message) {
  return function ack(error) {
    if (error) {
      log('[ERROR]', message);
    }
  };
}

function handleDeviceMessageToUI(eventEmitter, connectedObject, service, message) {
  // TODO: security to be handled later
  const { browserGuid } = connectedObject;
  const ws = findUIWebSocket(browserGuid);

  if (service === 'debugger') {
    if (ws !== false) {
      // ws.send(JSON.stringify(message));
    }
    const ds = debugSession.getCurrentSession();
    DEBUG_WEBSOCKET = ds && ds.getWsDebugProxy();
    if (DEBUG_WEBSOCKET && DEBUG_WEBSOCKET.readyState === WebSocket.OPEN) {
      log('- SENDING DEBUG_WEBSOCKET message');
      DEBUG_WEBSOCKET.send(JSON.stringify(message));
    } else {
      log('[ERROR] DEBUG_WEBSOCKET does not exist');
    }
  } else if (CONSOLE_COMMANDS.indexOf(message.command) !== -1) {
    message.connectedObject = connectedObject;
    if (ws === false) {
      log('UI Websocket not found for: ', browserGuid, ' --> send msg to all of them');
      Object.keys(allUIWebsockets).forEach((key) => {
        if (allUIWebsockets[key] && allUIWebsockets[key].ws.readyState === WebSocket.OPEN) {
          allUIWebsockets[key].ws.send(JSON.stringify(message));
        }
      });
    } else {
      ws.send(JSON.stringify(message));
    }
  }

  function findUIWebSocket(browserGuid) {
    if (allUIWebsockets[browserGuid]
			&& allUIWebsockets[browserGuid].ws.readyState === WebSocket.OPEN) {
      return allUIWebsockets[browserGuid].ws;
    }
    return false;
  }
}

function emitMessageFromDevice(eventEmitter, connectedObject, service, message) {
  if (service === 'debugger') {
    handleDeviceMessageToUI(eventEmitter, connectedObject, service, message);
    return;
  }
  if (message && message.command) {
    if (CONSOLE_COMMANDS.indexOf(message.command) !== -1) {
      // Send deviceInfo too
      const socket = allWebsockets[connectedObject.deviceId];
      const deviceInfo = socket
        ? allDeviceInfos[connectedObject.deviceId] || {
          deviceID: connectedObject.deviceId
        }
        : null;
      connectedObject.deviceInfo = deviceInfo;
      return handleDeviceMessageToUI(eventEmitter, connectedObject, service, message);
    }
  }
  eventEmitter.emit('message', {
    meta: {
      id: uuid.v4(),
      from: 'dispatcher',
      service,
      connectedObject,
      to: '*'
    },
    data: message
  });
}

function emitMessageFromUi(eventEmitter, connectedObject, service, message) {
  eventEmitter.emit('message', {
    meta: {
      id: uuid.v4(),
      from: 'browser',
      service,
      to: 'UI'
    },
    data: message
  });
}

function setupConnectedWebSocketForDevice(ws, service, connectedObject) {
  const { deviceId } = connectedObject;
  const wsServicesParent = allWebsockets[deviceId];
  const { eventEmitter } = wsServicesParent;

  if (wsServicesParent.initialized.indexOf(service) === -1) {
    if (service === SERVICES.CONTROL) {
      wsServicesParent.initialized.push(service);
      wsServicesParent.instances[service] = new ControlService();
      wsServicesParent.instances[service].init(eventEmitter, {
        logToConsole
      });
    } else if (service === SERVICES.FILE_TRANSFER) {
      wsServicesParent.initialized.push(service);
      wsServicesParent.instances[service] = new FileService();
      wsServicesParent.instances[service].init(eventEmitter, {
        data: {
          ws
        },
        logToConsole,
        bypassSecurityCheck
      });
    } else if (service === SERVICES.DEBUGGER) {
      log('- Sending message back to device on debugger');
      wsServicesParent.initialized.push(service);
      const message = {
        id: 1,
        command: 'start'
      };
      handleDeviceMessageToUI(eventEmitter, connectedObject, service, message);
    }
  } else if (service === SERVICES.FILE_TRANSFER) {
    wsServicesParent.instances[service].replaceWebsocket(ws);
  }

  ws.on('message', (message) => {
    parseEachJSON(message, (err, parsedMessage) => {
      if (err) {
        setTimeout(() => {
          console.error(err);
          throw err;
        }, 1);
      }
      emitMessageFromDevice(eventEmitter, connectedObject, service, parsedMessage);
      log('\n[MESSAGE RECEIVED]:[', deviceId, '/', service, ']:\n', parsedMessage.command, '\n');
    });
  });

  setupOnConnectionEventEmitterForDevice(eventEmitter, ws, service);
}

// TODO: When start command is issued from the UI Websocket, the below function should be triggered
function setupConnectedWebSocketForUI(ws, service, connectedObject) {
  const { browserGuid } = connectedObject;
  const wsServicesParent = allUIWebsockets[browserGuid];
  const { eventEmitter } = wsServicesParent;

  if (wsServicesParent.initialized.indexOf(SERVICES.UI) === -1) {
    wsServicesParent.initialized.push(SERVICES.UI);
    wsServicesParent.instances[SERVICES.UI] = new UIService();
    wsServicesParent.instances[SERVICES.UI].init(eventEmitter, {
      logToConsole
    });
  }

  ws.on('message', (message) => {
    log('\n[MESSAGE RECEIVED]:[', browserGuid, '/', service, ']:\n', message.command, '\n');
    parseEachJSON(message, (err, parsedMessage) => {
      if (err) {
        setTimeout(() => {
          console.error(err);
          throw err;
        }, 1);
      }
      emitMessageFromUi(eventEmitter, connectedObject, service, parsedMessage);
    });
  });

  setupOnConnectionEventEmitterForUi(eventEmitter, ws, service);
}

function setupOnConnectionEventEmitterForDevice(eventEmitter, ws, service) {
  eventEmitter.emit('connection', {
    meta: {
      id: uuid.v4(),
      service,
      to: '*'
    },
    data: {
      ws
    }
  });
}

function setupOnConnectionEventEmitterForUi(eventEmitter, ws, service) {
  setupOnConnectionEventEmitterForDevice(eventEmitter, ws, service);
}

function setupOnMessageEventEmitterForDevice(eventEmitter, connectedObject) {
  const { deviceId } = connectedObject;
  const { browserGuid } = connectedObject;
  const { securityGuid } = connectedObject;

  eventEmitter.on('message', (message) => {
    const { meta } = message;
    meta.browserGuid = browserGuid;
    meta.deviceId = deviceId;
    meta.securityGuid = securityGuid;

    log('Device eventEmitter received message\n', message.command);

    if (!meta.from) {
      log('[ERROR] no meta.from');
      return;
    }
    if (deviceId === 'browser') {
      if (!allUIWebsockets[browserGuid]) {
        return log('[ERROR] Error handling not yet implemented when browserGuid does not correspond to a UI Websocket');
      }
      allUIWebsockets[browserGuid].eventEmitter.emit('message', message);
    } else {
      handleMessage(message);
    }
  });

  function handleMessage(message) {
    let ws; let
      json_str;

    if (message.meta.to === SERVICES.UI) {
      // TODO: More complex UI handling -> which browser instance to respond to
      // ws = allWebsockets.localhost.UI;
      // below format [browserGuid]: { ws, securityGuid }
      // do the security check only when connecting
      ws = allUIWebsockets[message.meta.browserGuid] && allUIWebsockets[message.meta.browserGuid].ws;
    } else {
      const wsServicesParent = allWebsockets[deviceId];
      if (wsServicesParent) {
        if (message.meta.to === 'device') {
          ws = wsServicesParent[message.meta.from];
        } else {
          ws = wsServicesParent[message.meta.to];
        }
      }
    }
    if (ws) {
      if (message.meta.to === 'device') {
        json_str = JSON.stringify(message.data);
        sendMessageService.send(ws, json_str, ackErrorGenerator(`An error occured while sending message to device.`));
      } else if (message.meta.to === SERVICES.UI) {
        // TODO: Some changes might be needed here?
        json_str = JSON.stringify(message.data);
        ws.send(json_str, ackErrorGenerator(
          `An error occured while sending message to UI`
        ));
      }
    } else {
      log('ws does not exist --> send all of them');
      if (message.meta.to === SERVICES.UI) {
        Object.keys(allUIWebsockets).forEach((key) => {
          const { ws } = allUIWebsockets[key];
          json_str = JSON.stringify(message.data);
          ws.send(json_str, ackErrorGenerator(
            `An error occured while sending message to UI`
          ));
        });
      }
    }
  }
}

function setupOnMessageEventEmitterForUI(eventEmitter, connectedObject) {
  const { deviceId } = connectedObject;
  const { browserGuid } = connectedObject;
  const { securityGuid } = connectedObject;

  eventEmitter.on('message', (message) => {
    const { meta } = message;
    meta.browserGuid = browserGuid;
    meta.deviceId = deviceId;
    meta.securityGuid = securityGuid;

    log('UI eventEmitter received message\n', message.command);

    if (!meta.from) {
      return log('[ERROR] no meta.from');
    }
    if (deviceId === 'browser') {
      handleMessage(message);
    } else {
      if (!allWebsockets[deviceId]) {
        return log('[ERROR] Error handling not yet implemented when browserGuid does not correspond to a UI Websocket');
      }
      allWebsockets[deviceId].eventEmitter.emit('message', message);
    }
  });

  function handleMessage(message) {
    let json_str;
    const targets = [];
    if (message.meta.to === SERVICES.UI) {
      // TODO: More complex UI handling -> which browser instance to respond to
      // ws = allWebsockets.localhost.UI;
      // below format [browserGuid]: { ws, securityGuid }
      // do the security check only when connecting
      message.meta.from !== 'browser'
				&& targets.push(allUIWebsockets[message.meta.browserGuid].ws);
    } else {
      const wsServicesParent = allWebsockets[deviceId];
      if (wsServicesParent) {
        if (message.meta.to === 'device') {
          targets.push(wsServicesParent[message.meta.from].ws);
        } else {
          targets.push(wsServicesParent[message.meta.to].ws);
        }
      }
      for (const i in allWebsockets) {
        if (allWebsockets[i].connectedObject.browserGuid === message.meta.browserGuid) {
          targets.push(allWebsockets[i].ws);
        }
      }
    }
    targets.forEach((ws) => {
      json_str = JSON.stringify(message.data);
      if (ws.readyState === WebSocket.OPEN) {
        message.meta.to === 'device' && sendMessageService.send(ws, json_str, ackErrorGenerator(
          `An error occured while sending message to device`
        ));
        message.meta.to === 'UI' && ws.send(json_str, ackErrorGenerator(
          `An error occured while sending message to UI`));
      }
    });
    if (targets.length === 0) {
      log('ws does not exist');
    }
  }
}
