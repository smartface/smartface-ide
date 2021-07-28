const { execSync } = require('child_process');
const dispatcher = require('./dispatcher/dispatcher-index');
const LogToConsole = require('./common/LogToConsole');

function init(opts) {
  opts = opts || {};
  opts.ports = opts.ports || {};
  opts.events = opts.events || {};
  opts.meta = opts.meta || {
    logToConsole: false
  };
  opts.ports = {
    listen: {

    },
    serve: {
      dispatcher: opts.ports.dispatcher || 8081
    }
  };

  // taskHandler(opts.meta);
  new (dispatcher.init)(opts);
}

function taskHandler(opts) {
  if (opts.v) {
    const { log } = new LogToConsole(true);
    const { version } = require('../package.json');
    log("Current version of the SmartfaceDispatcherService : ", version);
    process.exit();
  } else if (opts.restart) {
    try {
      execSync('fuser -k 8081/tcp');
    } catch (ex) {
      // do nothing; process is not running; everything is OK
    }
  }
}

module.exports = {
  init
};
