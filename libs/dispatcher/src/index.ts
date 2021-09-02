import * as express from 'express';
import * as cors from 'cors';
import { ConfigurationService } from './modules/shared/ConfigurationService';
import getCombinedWSS from './modules/shared/combineWSSExpress';
import minimist = require('minimist');
import LogToConsole from './modules/shared/LogToConsole';
import { initRestServices } from './rest-services';

new ConfigurationService(minimist((process.argv.slice(2))));
const opts = ConfigurationService.instance.getOpts();
const logger = new LogToConsole(opts.meta.logToConsole, '[PROCESS]');

const app = express();
app.use(cors());
app.use(express.json({limit: '50mb'}));

const logToConsole = opts.meta.logToConsole;
const bypassSecurityCheck = opts.meta.bypassSecurityCheck;

const exWSS = getCombinedWSS({
    port: opts.ports.dispatcher,
	server: null,
    logToConsole,
	host: opts.host
}, app );

const { wss } = exWSS;

bypassSecurityCheck
wss

initRestServices(app);

process.on('uncaughtException', (err: any) => {
  logger && logger.log(JSON.stringify({
    err: 'Uncaught Exception',
    stack: err.stack && err.stack.toString(),
    msg: err.toString()
  }, null, '\t'));
  process.exit(1);
});

process.on('unhandledRejection', (err: any) => {
  logger && logger.log(JSON.stringify({
    err: 'Unhandled Rejection',
    stack: err.stack && err.stack.toString(),
    msg: err.toString()
  }, null, '\t'));
  process.exit(1);
});




