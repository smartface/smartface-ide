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

}

module.exports = UIService;
