const path = require('path');

const nsfw = require('@smartface/nsfw-prebuild');

const EVENT_TYPE = require('./src/core/event-type');
const run = require('./src/run');
const util = require('./src/util');

const { isExistsFileDir } = util;
const config = require('./src/config');

if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (str, newStr) {
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
      return this.replace(str, newStr);
    }
    return this.replace(new RegExp(str, 'g'), newStr);
  };
}

module.exports = function (args) {
  taskHandler(args);
  args.workspacePath && config.setWorkspacePath(args.workspacePath);
  config.initPathsFromArgs(args);
  const isStandalone = args.standalone;

  function checkStart(runImmediate) {
    console.log('├─ ℹ️ Checking workspace...');

    function doCheck() {
      isExistsFileDir(args.configFile).then((res) => {
        if (res.existing && res.file) {
          watchAll();
          clearInterval(interval);
        } else {
          console.log('├─ ⚠️ Settings file cannot be found');
        }
      });
    }

    var interval = setInterval(doCheck, 7000);
    runImmediate && doCheck();
  }

  function watchAll() {
    let configCounter = 0;
    let watcher = null;
    const configWatcheHandler = (event) => {
      const filename = path.join(event.directory || event.newDirectory, event.file || event.newFile);
      console.log('├─ ⏰ ⚙️ »', EVENT_TYPE[event.action], '« ', filename);      
      if (event === 'unlink') {
        watcher && watcher.stop({ silent: true });
        configWatcher.stop();
        console.log('├─ ⚙️ Config file has been deleted! call checkStart method 🫥');
        return checkStart();
      }
      ++configCounter;
      setTimeout((_) => {
        --configCounter;
        if (configCounter === 0 && (!config.initPathsFromConfigFile(args.configFile) || event.action === nsfw.actions.CREATED || event.action === 4)) {
          config.writeInfo();
          watcher && watcher.stop({ silent: true });
          watcher = run((_) => {
            console.log('├─ 🛑 ⏰ Watcher has been stopped! Retrying... in 5 secs.');
            watcher = null;
            configWatcher.stop();
            checkStart();
          }, isStandalone);
        }
      }, 1000);
    };

    nsfw(args.configFile,
      (events) => {
        let cachedEvents = {}; 
          events
          .filter( e => {
            let label = e.action + e.directory + e.file;
            if(cachedEvents[label]){
              return false;
            }
            cachedEvents[label] = 1;
            return true;
          })
          .forEach(e => configWatcheHandler(e));
      }, {
      errorCallback(errors) {
          util.writeError(errors, "Watcher Config Error");
          stop();
      }
  })
      .then((watcher) => {
        configWatcher = watcher;
          return watcher.start();
      })
      .then(() => {
        configWatcheHandler({ action: 4, directory: path.dirname(args.configFile), file: path.basename(args.configFile) });
      });
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
