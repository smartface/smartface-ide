const prepareErrorMsg = require("../utility").prepareErrorMsg;
const taskHandler = require("./taskHandler");

const execSync = require('child_process').execSync;
const RawIPC = require('node-ipc').IPC;
const ipc = new RawIPC();
const pingClient = new RawIPC();
const CONSTANTS = require("../constants");

const BRACKET_END = CONSTANTS.BRACKET_END;
const SERVER_PORT = CONSTANTS.SERVER_PORT;
const APP_NAME = CONSTANTS.SERVER_APP_NAME;
const queue = require('async/queue');

pingClient.config.id = `${APP_NAME}PingClient`;
pingClient.config.encoding = "utf8";
const SYNC_TASKS = [
    "install_package",
    "uninstall_package",
    "get_packages",
    "get_installed_packages"
];
module.exports = (function() {
    var opt = {};
    var sockets = [];

    function start(_opt) {
        opt = _opt || {};
        pingClient.config.logger = function() {};

        ipc.config.id = APP_NAME;
        ipc.config.retry = 15000;
        ipc.config.encoding = "utf8";
        ipc.config.maxConnections = 15;
        ipc.config.logger = function(a) { opt.verbose && console.log(a) };


        if (opt.restart) {
            try {
                console.log("Kill running server...");
                execSync(`fuser -k ${SERVER_PORT}/tcp`);
            }
            catch (ex) {
                // do nothing; process is not running; everything is OK
            }
        }
        ipc.serveNet(
            SERVER_PORT,
            () => {
                console.log(`Smartface modules-manager (${SERVER_PORT}) is up and running...`);
                var q = queue((task, cb) => {
                    //do task
                    doTask(task.parsedData, task.parsedData.broadcast ? sockets : [task.socket], cb);
                }, 1);
                // assign a callback
                q.drain = () => {};
                ipc.server.on(
                    'doWhatEver',
                    (data, socket) => {
                        var parsedData = {};
                        if (sockets.indexOf(socket) === -1)
                            sockets.push(socket);
                        try {
                            parsedData = JSON.parse(data);
                        }
                        catch (e) {}

                        if (SYNC_TASKS.indexOf(parsedData.task) !== -1) {
                            q.push({
                                socket,
                                parsedData
                            });
                        }
                        else
                            doTask(parsedData, parsedData.broadcast ? sockets : [socket]);
                    }
                );
                ipc.server.on(
                    "ping",
                    (data, socket) => {
                        ipc.server.emit(socket, 'ping', "OK");
                    });

                ipc.server.on(
                    'socket.disconnected',
                    (socket) => {
                        sockets = sockets.filter(s => s !== socket);
                        socket.name && console.log('DISCONNECTED ', socket.name);
                    }
                );
            }
        );

        ipc.server.on(
            'error',
            (err) => {
                console.log('Got an ERROR!', err);
            }
        );
        ipc.server.start();

        var counter = 0;
        setInterval(() => {
            pingClient.connectToNet(
                APP_NAME,
                CONSTANTS.SERVER_PORT,
                function() {
                    pingClient.of[APP_NAME].on(
                        'connect',
                        () => {
                            counter = 0;
                            pingClient.disconnect(APP_NAME);
                        }
                    );
                    pingClient.of[APP_NAME].on(
                        'error',
                        (data) => {
                            if (++counter < 3)
                                return;
                            process.stderr.write(data.toString());
                            process.exit(1);
                        }
                    );
                }
            );
        }, 5000);
    }

    function doTask(parsedData, _sockets, cb) {
        console.log("Task: ", parsedData.task);
        taskHandler(Object.assign({}, opt, { data: parsedData }),
            (err, res) => {
                err && console.log(prepareErrorMsg(err));
                _sockets.forEach(s => ipc.server.emit(
                    s,
                    'doWhatEver',
                    JSON.stringify({
                        id: parsedData.id,
                        task: parsedData.task,
                        body: err ? prepareErrorMsg(err) : res,
                        statusCode: err ? 500 : 200,
                        success: !!!err
                    })));
                cb && cb();
            });
    }

    return {
        start: start,
        broadcastTask: taskData => {
            doTask(taskData, sockets);
        }
    };

})();
