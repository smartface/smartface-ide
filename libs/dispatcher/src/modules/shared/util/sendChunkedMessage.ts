import WebSocket = require('ws');
import LogToConsole from '../LogToConsole';

const MAX_CHUNK_SIZE = 10240; // In terms of bytes > 10 Kb

export type WebsocketWithStream = WebSocket & {
  stream: (
    options: { binary?: boolean },
    callback: (err: Error, send: (data: string | Buffer, isBinary: boolean) => void) => void
  ) => void;
};
export default function sendChunkedMessage(
  ws: WebsocketWithStream,
  data: string | Buffer,
  isBinary: boolean,
  cb: (errors: string[], dataLengt?: number) => void
) {
  const options = isBinary
    ? {
        binary: true,
      }
    : {};
  let callback = cb || (_ => _);
  const errors = checkInput(ws, data);

  if (errors.length) {
    return callback(errors);
  }
  if (typeof data === 'string') {
    data = Buffer.from(data, 'utf-8');
  }

  /*** Perform ws.stream ***/

  const dataLength = data.length;
  const numOfChunks = Math.ceil(dataLength / MAX_CHUNK_SIZE);
  let i = 0;
  let offset = 0;

  ws.stream(options, (err, send) => {
    if (err) {
      errors.push('Error creating stream');
      return callback(errors);
    }
    let dataToSend = null;
    if (++i !== numOfChunks) {
      dataToSend = data.slice(offset, offset + MAX_CHUNK_SIZE);
      send(dataToSend, false);
    } else {
      dataToSend = data.slice(offset);
      send(dataToSend, true);
      LogToConsole.instance.log('Sending last part ' + i);
      callback(null, dataLength);
    }
    offset += MAX_CHUNK_SIZE;
  });
}

function checkInput(ws: WebSocket, data: string | Buffer) {
  var errors = [];

  if (!data) {
    errors.push('No data provided.');
  } else {
    if (!(typeof data === 'string') && !Buffer.isBuffer(data)) {
      errors.push('Invalid type of data. String or Buffer should be provided.');
    }
  }
  if (!ws) {
    errors.push('There is no web socket.');
  } else {
    if (ws.readyState !== WebSocket.OPEN) {
      errors.push('Web socket is not open.');
    }
  }
  return errors;
}
