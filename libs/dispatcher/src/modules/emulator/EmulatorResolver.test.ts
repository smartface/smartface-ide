import WebSocket = require("ws");
import { createApi } from "./craeteApi";

function createWebSocketClient(){
  return new WebSocket("http://localhost:9001");
}
describe("EmulatorResolver", () => {
  let wss:WebSocket.Server;
  beforeEach(() => {
    wss = new WebSocket.Server({ port: 9001 });
    createApi(wss);
  });
  afterEach(() => {
    wss.close();
  });
  it("should", () => {
    const emulatorClient = createWebSocketClient();
    emulatorClient.on("open", () => {
      emulatorClient.on("message", (data) => {
        expect(data).toBe("test");
      });
      emulatorClient.send(JSON.stringify({command: "xx", payload: []}));
    })
  });
})