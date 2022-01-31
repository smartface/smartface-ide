#!/usr/bin/env node
const args = require('minimist')(process.argv.slice(2));
const ipc = require('node-ipc');
const CONSTANTS = require("../constants");

const BRACKET_END = CONSTANTS.BRACKET_END;
const SERVER_PORT = CONSTANTS.SERVER_PORT;
const APP_NAME = CONSTANTS.CLIENT_APP_NAME;
const SERVER_APP_NAME = CONSTANTS.SERVER_APP_NAME;

ipc.config.id = APP_NAME;
ipc.config.encoding = "utf8";
ipc.config.retry = 5000;
ipc.config.logger = function() {};

var stdinData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', message => {
    stdinData += message;
    if (stdinData.endsWith(BRACKET_END)) {
        var splitted = stdinData.split(BRACKET_END);
        splitted = splitted[splitted.length - 2];
        emitTask(splitted);
        stdinData = "";
    }
});

function emitTask(data) {
    ipc.of[SERVER_APP_NAME].emit(
        'doWhatEver',
        data
    );
}
//console.error(args);
ipc.connectToNet(
    SERVER_APP_NAME,
    SERVER_PORT,
    function() {
        ipc.of[SERVER_APP_NAME].on(
            'connect',
            function() {
                //console.error("connected",args);
                /*
                if (args.task) {
                    ipc.of[SERVER_APP_NAME].emit(
                        args.task, Object.assign({}, args)
                    );
                }
                else {
                    ipc.of[SERVER_APP_NAME].emit(
                        'init'
                    );
                }
                */
            }
        );
        ipc.of[SERVER_APP_NAME].on(
            'doWhatEver',
            function(data) {
                process.stdout.write(data + BRACKET_END);
            }
        );
        ipc.of[SERVER_APP_NAME].on(
            'error',
            function(data) {
                process.stderr.write(data.toString());
            }
        );
        ipc.of[SERVER_APP_NAME].on(
            'disconnect',
            function() {
                process.stderr.write("client disconnected from the server");
                process.exit(1);
            }
        );
    }
);