const path = require("path");
const chokidar = require('chokidar');

const util = require("../util");
const intervalChecker = require("../util/intervalChecker");
const styleGeneration = require("./generateStyles");
const DEFAULT_PATHS = require("../config").DEFAULT_PATHS;
const isExistsFileDir = util.isExistsFileDir;
const getPath = require("../config").getPath;
const WATCHER_DELAY = 300; //ms
const LIBRARY_FILE_NAME = DEFAULT_PATHS.LIBRARY_FILE_NAME;
const MODULES_FILE_NAME = DEFAULT_PATHS.MODULES_FILE_NAME;

const WATCHER_STATUS = {
  "READY": "READY",
  "RUNNING": "RUNNING",
  "STOPPED": "STOPPED"
};

function Watcher(callBack) {

  var watcherThemes, watcherPgxFolder, status = WATCHER_STATUS.READY,
    pgxTimer, themesTimer;
  var themesGeneratorTaskCounter = 0;
  var libTranspilerTaskCounter = 0;

  const themesFolder = getPath("THEMES_FOLDER");
  const pgxFolder = getPath("PGX_FOLDER");
  const uiFolder = getPath("UI_FOLDER");

  this.start = watcherHandler => {
    var taskCount = 2;

    pgxTimer = intervalChecker(pgxFolder, false, startHelper, stop);
    themesTimer = intervalChecker(themesFolder, false, startHelper, stop);

    function startHelper() {
      if (--taskCount === 0) {
        _start(watcherHandler);
      }
    }
  };

  const _start = watcherHandler => {
    styleGeneration.initFolderPaths();
    status = WATCHER_STATUS.RUNNING;
    watcherThemes = chokidar.watch(themesFolder, {
      ignored: /(^|[\/\\])\../,
      ignoreInitial: true
    });

    watcherPgxFolder = chokidar.watch(pgxFolder, {
      ignoreInitial: true
    });

    watcherThemes.on("error", err => {
      util.writeError(err, "Watcher Themes Error");
      stop();
    });

    watcherPgxFolder.on("error", err => {
      util.writeError(err, "Watcher Pgx Error");
      stop();
    });

    watcherPgxFolder.on("all", (eventType, filename) => {
      if (eventType === "unlinkDir" && filename === pgxFolder)
        return stop();
      if (filename === pgxFolder)
        return;
      if (/library\/.*\.(pgx|cpx)/ig.test(filename)) {
        return; //skip library folder.
      }
      console.log("├─ 🔔  pgx ->", eventType, filename);
      //console.log('eventTrype:' + eventType + ' filename provided:' + filename);
      isExistsFileDir(uiFolder).then(res => {
        if (res.existing && res.dir) {
          if (eventType == "unlink") {
            watcherHandler.deleteScriptFile(filename);
          }
          else if (eventType === "change" || eventType === "add") {
            watcherHandler.changeHandler(filename).then(res => res);
          }
        }
        else {
          watcherHandler.transpileAllPgxFiles();
        }
      }, err => util.writeError(err, "isExistsFileDir"));
    });

    watcherThemes.on("all", (eventType, filename) => {
      if (eventType === "unlinkDir" && filename === themesFolder)
        return stop();
      ++themesGeneratorTaskCounter;
      setTimeout(_ => {
        if (--themesGeneratorTaskCounter === 0) {
          console.log("├─ 🔔  themes ->", eventType, path.relative(path.dirname(themesFolder), filename));
          generateStyles();
        }
      }, WATCHER_DELAY);
    });
    //First generations...
    // watcherHandler.transpileLibraryPgx(path.join(pgxFolder, LIBRARY_FILE_NAME));
    // watcherHandler.transpileAllPgxFiles();
    generateStyles();
  };


  const stop = (opt) => {
    var _opt = opt || {};
    if (status === WATCHER_STATUS.STOPPED) {
      return console.log("Watcher has already been stopped!");
    }!_opt.silent && util.writeError(new Error(`Check Following Folders Exist\n - ${pgxFolder}\n - ${themesFolder}`),
      status === WATCHER_STATUS.RUNNING ? "Watcher Unlink Error" : "Watcher Starting Error");
    status = WATCHER_STATUS.STOPPED;
    watcherPgxFolder && watcherPgxFolder.close();
    watcherThemes && watcherThemes.close();
    pgxTimer && clearInterval(pgxTimer);
    themesTimer && clearInterval(themesTimer);
    libTranspilerTaskCounter = 0;
    themesGeneratorTaskCounter = 0;
    return !_opt.silent && callBack(null, status);
  };

  this.stop = stop;

  function generateStyles() {
    styleGeneration.generateStyles().then(res => {}, err => util.writeError(err, "Watcher -> Generating Styles Error"));
  }
}

module.exports = Watcher;
