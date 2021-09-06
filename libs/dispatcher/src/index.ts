import { ConfigurationService } from './modules/shared/ConfigurationService';
import createWSS from './modules/shared/createWSS';
import minimist = require('minimist');
import { initRestServices } from './init-rest';
import { createWebServer } from './createServer';
import LogToConsole from './modules/shared/LogToConsole';

new LogToConsole();
new ConfigurationService(minimist((process.argv.slice(2))));
const args = ConfigurationService.instance.getCliArguments();

const [server, app] = createWebServer({port: args.ports.dispatcher, host: args.host});
const wss = createWSS({
    port: args.ports.dispatcher,
	  server,
  	host: args.host
});

initRestServices(app);

process.on('uncaughtException', (err: any) => {
  console.log(JSON.stringify({
    err: 'Uncaught Exception',
    stack: err.stack && err.stack.toString(),
    msg: err.toString()
  }, null, '\t'));
  process.exit(1);
});

process.on('unhandledRejection', (err: any) => {
  console.log(JSON.stringify({
    err: 'Unhandled Rejection',
    stack: err.stack && err.stack.toString(),
    msg: err.toString()
  }, null, '\t'));
  process.exit(1);
});




