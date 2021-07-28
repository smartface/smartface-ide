const MessageFactory = require('../common/MessageFactory');
const EventEmitter = require('events').EventEmitter;
const LogToConsole = require("../common/LogToConsole");

function UIService() {
    const UI = 'UI';
    const DEVICE = 'device';
    const MESSAGE = 'message';
    const FILE_TRANSFER = 'file-transfer';
    const DEBUGGER = 'debugger';
    const ALL = '*';
    const commandEventEmitter = new EventEmitter();
    var messageFactory = new MessageFactory();
    var request;
    var callbackList = {};
    var log;
    let debug;

    global.shared.uiCommandEventEmiter = commandEventEmitter;

    this.init = function(requestService, opts) {
        opts = opts || {};
        const logger = new LogToConsole(opts.logToConsole, '[UI]');
        log = logger.log;
        debug = logger.debug;
        request = requestService;
        log("UIService init");
    };

    this.handleMessage = function(from, message) {
        if (callbackList[message.id]) {
            callbackList[message.id](null, message);
        }
        else {
            if (message.command) {
                commandEventEmitter.emit(message.command, message);
                log("Command recieved:", message.command);
            }
        }
    };

    commandEventEmitter.on("stopDebug", function stopDebug(message) {
        global.shared.debuggerAttachIssued = false;
        var messageStop = messageFactory.createMessage("stop", {});
        sendRequest(DEVICE, null, messageStop);
    });

    function sendRequest(to, command, message, callback) {
        if (callback) {
            callbackList[message.id] = callback;
        }
        request(MESSAGE, to, command, message);
    }
}

module.exports = UIService;
