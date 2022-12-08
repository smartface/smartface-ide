const fs = require('fs');
const path = require('path');
const WatcherHandler = require('./watcherHandler');
const RouterWatcherHandler = require('./routerWatcherHandler');
const Watcher = require('./core/watcher');
const util = require('./util');
const getPath = require('./config').getPath;

function run(callBack, isStandalone = false) {
  const scriptsFolder = getPath('UI_FOLDER');
  const watcherHandler = new WatcherHandler(isStandalone);
  const routerWatcherHandler = new RouterWatcherHandler(isStandalone);
  const watcher = isStandalone ? null : new Watcher(callBack);
  // first phase.
  util.mkdirpSync(scriptsFolder);
  util.createClearDir(scriptsFolder).then(res => {
    watcherHandler.init();
    watcher && watcher.start(watcherHandler, routerWatcherHandler); // start to watch
    routerWatcherHandler.transpileAllRouterFiles();
  });

  watcherHandler.on('readyFileContent', (content, filePath, isChanged) => {
    if (!isChanged) {
      //return console.log("├─ " + path.basename(filePath) + " has already been generated");
    }
    util.mkdirpSync(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('├─ 📄  Generated ' + path.relative(path.dirname(scriptsFolder), filePath));
  });

  watcherHandler.on('libraryFileChanged', pgx => {
    //console.log("libraryFileChanged ", pgx);
  });
  return watcher;
}

module.exports = run;
