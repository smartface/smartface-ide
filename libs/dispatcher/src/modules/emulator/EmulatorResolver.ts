import WebSocket = require("ws");
import { IDisposeable } from "../../core/IDisposeable";

export class EmulatorResolver implements IDisposeable {
  constructor(private ws: WebSocket){
    this.ws.on("open", () => {})
  }
  dispose(): void {
    this.ws = null;
  }
}