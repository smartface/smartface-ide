const WebSocket = require('ws');
const LogToConsole = require("../common/LogToConsole");
const MAX_CHUNK_SIZE = 100000; // In terms of bytes

function SendChunkedMessage(logToConsole) {
    if (!(this instanceof SendChunkedMessage))
        return new SendChunkedMessage();

    /**
     * Returns the bytes sent over ws, if an error occurs, returns a list of
     * strings which denote errors
     */
    this.send = function(ws, data, isBinary, callback) {
        var log = new LogToConsole(logToConsole).log,
            errors = checkInput(ws, data),
            dataLength,
            numOfChunks,
            i = 0,
            offset = 0,
            options;

        if (typeof isBinary === 'function') {
            callback = isBinary;
            isBinary = false;
        }

        callback || (callback = function() {});
        options = isBinary ? {
            binary: true
        } : {};

        if (errors.length) {
            return callback(errors);
        }
        if (typeof data === 'string') {
            data = new Buffer(data, "utf-8");
        }

        /*** Perform ws.stream ***/

        dataLength = data.length;
        numOfChunks = Math.ceil(dataLength / MAX_CHUNK_SIZE);
        ws.stream(options, function(err, send) {
            if (err) {
                errors.push('Error creating stream');
                return callback(errors);
            }
            else {
                log("Sending part " + i);
                var dataToSend = null;
                if (++i !== numOfChunks) {
                    dataToSend = data.slice(offset, offset + MAX_CHUNK_SIZE);
                    send(dataToSend, false);
                }
                else {
                    dataToSend = data.slice(offset);
                    send(dataToSend, true);
                    callback(null, dataLength);
                }
                offset += MAX_CHUNK_SIZE;
            }
        });
    };

    function checkInput(ws, data) {
        var errors = [];

        if (!data) {
            errors.push('No data provided.');
        }
        else {
            if (!(typeof data === 'string') && !Buffer.isBuffer(data)) {
                errors.push('Invalid type of data. String or Buffer should be provided.');
            }
        }
        if (!ws) {
            errors.push('There is no web socket.');
        }
        else {
            if (ws.readyState !== WebSocket.OPEN) {
                errors.push('Web socket is not open.');
            }
        }
        return errors;
    }
}

module.exports = SendChunkedMessage;
