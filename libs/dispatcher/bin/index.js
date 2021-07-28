#!/usr/bin/env node

if (global.v8debug) {
  global.v8debug.Debug.setBreakOnUncaughtException();
}
global.shared = {
  response: {}
};
const { init } = require('../src/index');
const args = require('minimist')(process.argv.slice(2));
const LogToConsole = require('../src/common/LogToConsole');

let log;
const opts = convertCLIArgsToOpts(args);

init(opts);

function convertCLIArgsToOpts(args) {
  const opts = {
    meta: {},
    ports: {}
  };

  opts.meta.logToConsole = !!args.logToConsole || !!args.logtoconsole || !!args.verbose;
  opts.meta.restart = !!args.restart;
  opts.meta.v = !!args.v;
  opts.meta.bypassSecurityCheck = !!args.bypasssecuritycheck || !!args.bypassSecurityCheck;
  if (args.port) {
    opts.ports.dispatcher = args.port;
  }
  opts.host = args.host;
  log = new LogToConsole(opts.meta.logToConsole, '[PROCESS]').log;
  return opts;
}

process.on('uncaughtException', (err) => {
  log && log(JSON.stringify({
    err: 'Uncaught Exception',
    stack: err.stack && err.stack.toString(),
    msg: err.toString()
  }, null, '\t'));
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  log && log(JSON.stringify({
    err: 'Unhandled Rejection',
    stack: err.stack && err.stack.toString(),
    msg: err.toString()
  }, null, '\t'));
  process.exit(1);
});
