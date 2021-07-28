const exec = require('child_process').exec;
const TextDecoder = require("text-encoding").TextDecoder;
const parseEachJSON = require("ws-json-organizer");
const WebSocket = require('ws');
const MessageFactory = require('../common/MessageFactory');
const messageFactory = new MessageFactory();
const LogToConsole = require("../common/LogToConsole");
const activeSessions = [];
const DEBUG_PORT = 11101;
var currentSesssion = null;
var log; // Assigned to a function

DebugSession.NEW = 0;
DebugSession.CONNECTED = 1;
DebugSession.CLOSED = 2;

var debugProxyReady = (function() {
    var busy = false;

    return function debugProxyReady(callback) {
        if (busy) return;
        busy = true;

        var retries = 0;
        var interval;
        performCheck();

        function checkDebugProxyRunning(cb) {
            exec('fuser ' + DEBUG_PORT + '/tcp', (error, stdout, stderr) => {
                cb(!error);
            });
        }

        function performCheck() {
            checkDebugProxyRunning(function(isRunning) {
                if (isRunning) {
                    busy = false;
                    callback();
                }
                else {
                    interval = Math.pow(2, retries++) * 100;
                    setTimeout(performCheck, interval);
                }
            });
        }
    };
})();

function DebugSession(connectedObject, opts) {
    const me = this;
    var wsCounter = 0; // For logging purposes
    var wsDeviceDebug = selectDebugDeviceWebsocket(connectedObject);
    var wsUI = selectDebugUIWebSocket(connectedObject);
    var wsDebugProxy = null;

    me.id = Number(new Date());
    me.state = DebugSession.NEW;
    activeSessions.push(me);
    opts = opts || {};
    log = new LogToConsole(opts.logToConsole, '[DEBUGGER]').log;

    if (!wsDeviceDebug || !wsUI)
        return false;

    me.connectedObject = connectedObject;

    me.toString = function toStringDebugSession() {
        return 'localhost:' + DEBUG_PORT + '(' + me.id + '-' + wsCounter + ')';
    };

    me.getWsDebugProxy = function getWsDebugProxyDebugSession() {
        return wsDebugProxy;
    };

    me.close = function closeDebugSession(connectedObject) {
        connectedObject = connectedObject || me.connectedObject;
        me.state = DebugSession.CLOSED;
        if (connectedObject.debugger !== me.connectedObject.debugger &&
            wsDebugProxy &&
            wsDebugProxy.readyState < WebSocket.CLOSING) {
            wsDebugProxy.send(JSON.stringify(messageFactory.createMessage("stop", {})));
        }
        if (connectedObject.UI !== me.connectedObject.UI &&
            wsUI &&
            wsUI.readyState < WebSocket.CLOSING) {
            wsUI.send(JSON.stringify(messageFactory.createMessage("stopDebug", {})));
        }
        activeSessions.remove(me);
        log("Closing session:");
    };

    function connectToDebugger() {
        if (me.state >= DebugSession.CLOSED)
            return;
        wsDebugProxy = new WebSocket('ws://localhost:' + DEBUG_PORT);
        wsCounter++;
        wsDebugProxy.on("error", function() {
            log("wsDebugProxy connection onError");
        });
        wsDebugProxy.on("close", function() {
            log("wsDebugProxy connection onClose");
            if (me.state < DebugSession.CLOSED)
                debugProxyReady(connectToDebugger);
        });
        wsDebugProxy.on('open', function() {
            log("wsDebugProxy connection onOpen");
            me.state = DebugSession.CONNECTED;
        });
        wsDebugProxy.on('message', function(message) {
            if (message instanceof Uint8Array) {
                message = new TextDecoder("utf-8").decode(message);
            }
            log('Received from DEBUG_PORT: %s', message);

            parseEachJSON(message, function(err, parsedMessage) {
                if (err) {
                    console.error('JSON.parse error for message: \n', message);
                    setTimeout(function() {
                        throw err;
                    }, 1);
                }
                else {
                    if (wsDeviceDebug && wsDeviceDebug.readyState < WebSocket.CLOSING) {
                        try {
                            wsDeviceDebug.send(JSON.stringify({
                                command: "message",
                                data: parsedMessage
                            }));
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                    else {
                        log('Device ws does not exist');
                    }
                }
            }, me);
        });
    }

    function closeMe() {
        me.close();
        wsUI.send(JSON.stringify(messageFactory.createMessage("stopDebug", {})));
    }

    wsDeviceDebug.on("close", closeMe);
    wsUI.on("close", _ => me.close());

    clearSessions();
    debugProxyReady(connectToDebugger);
}

// TODO: The selection of the debug device should be handled from the UI
function selectDebugDeviceWebsocket(connectedObject) {
    const allWebsockets = global.shared.allWebsockets;
    return allWebsockets[connectedObject.deviceId] && allWebsockets[connectedObject.deviceId].debugger;
}

function selectDebugUIWebSocket(connectedObject) {
    const allUIWebsockets = global.shared.allUIWebsockets;
    return allUIWebsockets[connectedObject.browserGuid] && allUIWebsockets[connectedObject.browserGuid].ws;
}

function clearSessions() {
    var s, i, max = 0,
        cloneSession = activeSessions.slice(0);
    for (i in cloneSession) {
        s = cloneSession[i];
        if (s.state !== DebugSession.CLOSED) {
            if (s.id > max) {
                max = s.id;
            }
        }

    }
    for (i in cloneSession) {
        s = cloneSession[i];
        if (s.id < max || s.state === DebugSession.CLOSED) {
            s.state !== DebugSession.CLOSED && s.close(s.connectedObject);
            activeSessions.remove(s);
        }
    }
    if (activeSessions.length > 1) {
        throw Error("Active Debug Session count should be maximum 1");
    }
    currentSesssion = activeSessions[0] || null;
}

activeSessions.remove = function activeSessionsRemove(session) {
    var removeIndex = activeSessions.indexOf(session);
    if (removeIndex > -1) {
        activeSessions.splice(removeIndex, 1);
    }
};

module.exports = {
    createNewSession: function createNewSession(connectedObject, opts) {
        return new DebugSession(connectedObject, opts);
    },
    getCurrentSession: function getCurrentSession() {
        return currentSesssion;
    }
};
