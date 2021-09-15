import WebSocket = require('ws');
import LogToConsole from '../LogToConsole';

const KEEPALIVE_INTERVAL = 15000;

export default class KeepAliveInterval {
  private intervalTimer: NodeJS.Timeout;

  constructor(private ws: WebSocket, private service: string) {}

  start() {
    if (this.intervalTimer) {
      throw new Error("IntervalTimer couldn't be started > It's already been active");
    }
    this.intervalTimer = setInterval(() => {
      this.ws.send(JSON.stringify({ command: 'keepAlive', service: this.service }), err => {
        if (err) {
          LogToConsole.instance.error(err);
        }
      });
    }, KEEPALIVE_INTERVAL);
  }

  stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    } else {
      throw new Error("IntervalTimer couldn't be stopped > It's already been passive");
    }
  }
}
