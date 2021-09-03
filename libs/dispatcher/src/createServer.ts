import * as express from 'express';
import * as cors from 'cors';
import { createServer } from 'http';

export function createWebServer({port, host}:{port: number, host: string}){
  const app = express();
  app.use(cors());
  app.use(express.json({limit: '50mb'}));
  
  const server = createServer(app);
  server.on('error', (err) => {
    if (global.v8debug) {
      debugger;
    } else {
      console.error('[ERROR]', err);
      throw err;
    }
  });
  
  server.listen(port, host);
  
  return [server, app] as const;
}