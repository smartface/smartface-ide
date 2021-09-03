import WebSocket = require("ws");
import { EmulatorResolver } from "./EmulatorResolver";

const clientCollection = new Set<EmulatorResolver>();

export function createApi(wss: WebSocket.Server) {
  wss.on("connection", (ws) => {
    const resolver = new EmulatorResolver();
    clientCollection.add(resolver);
    ws.on('message', (e) => {
      resolver.runMessage(e);
    });
    ws.on('close', (e) => {
      clientCollection.delete(resolver);
    });
  });
}
