const chokidar = require('chokidar');

const run = require('./src/run');
const util = require('./src/util');

const { isExistsFileDir } = util;
const config = require('./src/config');
const { readAndCheckComponentsTestID } = require('./src/testid-checker');

module.exports = function (args) {
  taskHandler(args);
  args.workspacePath && config.setWorkspacePath(args.workspacePath);
  config.initPathsFromArgs(args);
  const isStandalone = args.standalone;

  function checkStart(runImmediate) {
    console.log('checkstart starting...');

    function doCheck() {
      isExistsFileDir(args.configFile).then((res) => {
        if (res.existing && res.file) {
          console.log('checkstart if in');
          // readAndCheckComponentsTestID();
          watchAll();
          clearInterval(interval);
        } else console.log('Settings file cannot be found');
      });
    }

    var interval = setInterval(doCheck, 7000);
    runImmediate && doCheck();
  }

  function watchAll() {
    let configCounter = 0;
    const configWatcher = chokidar.watch(args.configFile);
    let watcher = null;
    configWatcher.on('all', (event, file) => {
      console.log('Config Watcher Event: ', event, args.configFile);
      if (event === 'unlink') {
        watcher && watcher.stop({ silent: true });
        configWatcher.close();
        console.log('Config file has been deleted! call checkStart method');
        return checkStart();
      }
      ++configCounter;
      setTimeout((_) => {
        --configCounter;
        if (configCounter === 0 && (!config.initPathsFromConfigFile(args.configFile) || event === 'add')) {
          config.writeInfo();
          watcher && watcher.stop({ silent: true });
          watcher = run((_) => {
            console.log('Watcher stopped ! Retrying... in 5 secs.');
            watcher = null;
            configWatcher.close();
            checkStart();
          }, isStandalone);
        }
      }, 1000);
    });
    configWatcher.on('error', (e) => util.writeError(e, 'Config Watcher Error'));
  }

  checkStart(true);
};

function taskHandler(opts) {
  if (opts.v || opts.version) {
    console.dir(require('./package.json').version);
    process.exit();
  } else if (opts.restart) {
    // TODO clean
  }
}

process.on('uncaughtException', (reason) => {
  console.log('├─── ! ☠️ ! ────────────────── Uncaught Exception ─────────────────────────┤');
  console.log(reason.stack ? reason.stack.toString('utf8') : reason.toString('utf8'));
  if (reason.code && reason.code === 'EACCES') setTimeout(() => { process.exit(1); }, 3000);
});

process.on('unhandledRejection', (reason, p) => {
  console.log('├─── ! ☠️ ! ─────────────────── Unhandled Rejection ─────────────────────────┤');
  console.log(reason.stack ? reason.stack.toString('utf8') : reason.toString('utf8'));
  // application specific logging, throwing an error, or other logic here
  if (reason.code && reason.code === 'EACCES') setTimeout(() => { process.exit(1); }, 3000);
});
