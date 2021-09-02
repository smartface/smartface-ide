import WebSocket = require("ws");
import { EmulatorResolver } from "./EmulatorResolver";

const clientCollection = new Set<EmulatorResolver>();

export function createApi(wss: WebSocket.Server) {
  wss.on("connection", (ws) => {
    const resolver = new EmulatorResolver(ws);
    clientCollection.add(resolver);
    ws.on('close', (e) => {
      resolver.dispose();
      clientCollection.delete(resolver);
    });
  })
}
