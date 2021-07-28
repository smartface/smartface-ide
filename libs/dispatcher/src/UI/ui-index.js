const UIService = require('./UIService');
const LogToConsole = require("../common/LogToConsole");

function UI() {
    const UISERVICE = "UI";
    var self = this;
    var log;

    self.eventEmitter = null;
    self.UIService = new UIService();

    this.init = function(emitter, opts) {
        opts = opts || {};

        if (self.eventEmitter) {
            self.eventEmitter.removeListener('connection', onConnection);
            self.eventEmitter.removeListener('data', onData);
            self.eventEmitter.removeListener('message', onData);
        }

        self.eventEmitter = emitter;
        self.eventEmitter.on('connection', onConnection);
        self.eventEmitter.on('data', onData);
        self.eventEmitter.on('message', onData);
        self.UIService.init(emit, {
            logToConsole: opts.logToConsole
        });

        log = new LogToConsole(opts.logToConsole, '[UI]').log;
    };

    function onConnection(data) {
        if ((data.meta.from && data.meta.from === UISERVICE) || data.meta.service !== UISERVICE) {
            return;
        }
    }

    function onData(data) {
        if (skip(data.meta))
            return;

        var dataWithoutMeta = removeMeta(data);
        
        self.UIService.handleMessage(data.meta.from, dataWithoutMeta);
    }

    function addMeta(to, command, message) {
        var messageWithMeta = {
            "meta": {
                "from": UISERVICE,
                "to": to,
                "command": command
            },
            "data": message
        };
        return messageWithMeta;
    }

    function removeMeta(data) {
        return data.data;
    }

    function skip(meta) {
        if (meta.from === UISERVICE)
            return true;

        if (meta.to === UISERVICE || meta.to === "*")
            return false;

        return true;
    }

    function emit(event, to, command, message) {
        self.eventEmitter.emit(event, addMeta(to, command, message));
    }
}

module.exports = UI;
