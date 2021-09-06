const ControlService = require('./ControlService');
const LogToConsole = require("../common/LogToConsole");

function Service() {
    const CONTROLSERVICE = "control";
    var self = this;
    var log;

    self.eventEmitter = null;
    self.controlService = new ControlService();

    this.init = function(emitter, opts) {
        opts = opts || {};

        if (self.eventEmitter) {
            self.eventEmitter.removeListener('data', onData);
            self.eventEmitter.removeListener('message', onData);
        }

        self.eventEmitter = emitter;
        self.eventEmitter.on('data', onData);
        self.eventEmitter.on('message', onData);
        self.controlService.init(emit, {
            logToConsole: opts.logToConsole
        });

        log = new LogToConsole(opts.logToConsole, '[CONTROL]').log;
    };


    function onData(data) {
        if (skip(data.meta))
            return;

        var dataWithoutMeta = removeMeta(data);
        self.controlService.handleMessage(data.meta.from, dataWithoutMeta, data.meta.connectedObject);
    }

    function addMeta(to, command, message) {
        var messageWithMeta = {
            "meta": {
                "from": CONTROLSERVICE,
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
        if (meta.from === CONTROLSERVICE)
            return true;

        if (meta.to === CONTROLSERVICE || meta.to === "*") {
            return false;
        }
        return true;
    }

    function emit(event, to, command, message) {
        self.eventEmitter.emit(event, addMeta(to, command, message));
    }
}

module.exports = Service;
