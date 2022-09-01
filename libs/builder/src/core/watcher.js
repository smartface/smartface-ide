const path = require("path");
const nsfw = require('@smartface/nsfw-prebuild');

const util = require("../util");
const intervalChecker = require("../util/intervalChecker");
const styleGeneration = require("./generateStyles");
const isExistsFileDir = util.isExistsFileDir;
const getPath = require("../config").getPath;
const EVENT_TYPE = require('./event-type');
const WATCHER_DELAY = 400; //ms

/*
const DEFAULT_PATHS = require("../config").DEFAULT_PATHS;
const LIBRARY_FILE_NAME = DEFAULT_PATHS.LIBRARY_FILE_NAME;
const MODULES_FILE_NAME = DEFAULT_PATHS.MODULES_FILE_NAME;
*/ const WATCHER_STATUS = {
    "READY": "READY",
    "RUNNING": "RUNNING",
    "STOPPED": "STOPPED"
};

function Watcher(callBack) {
    let watcherThemes;
    let watcherPgxFolder;
    let status = WATCHER_STATUS.READY;
    let pgxTimer;
    let themesTimer;
    let themesGeneratorTaskCounter = 0;
    let libTranspilerTaskCounter = 0;

    const themesFolder = getPath("THEMES_FOLDER");
    const pgxFolder = getPath("PGX_FOLDER");
    const uiFolder = getPath("UI_FOLDER");
    const libraryFolder = path.join(pgxFolder, 'library');
    let watcherEnabled = true;

    this.start = watcherHandler => {
        let taskCount = 2;
        pgxTimer = intervalChecker(pgxFolder, false, startHelper, stop);
        themesTimer = intervalChecker(themesFolder, false, startHelper, stop);

        function startHelper() {
            if (--taskCount === 0) {
                _start(watcherHandler);
            }
        }
    };

    const _start = watcherHandler => {
        watcherHandler.setWatcherEnabledStatusFunc((enabled) => {
            watcherEnabled = enabled;
        });

        styleGeneration.initFolderPaths();
        status = WATCHER_STATUS.RUNNING;

        nsfw(themesFolder,
            (events) => {
                events.forEach(e => this.themesWatcherHandler(e));
            }, {
            errorCallback(errors) {
                util.writeError(errors, "Watcher Themes Error");
                stop();
            }
        })
            .then((watcher) => {
                watcherThemes = watcher;
                return watcher.start();
            })
            .then(() => {
            });

        nsfw(pgxFolder,
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
                .forEach(e => this.pgxWatcherHandler(e));
            }, {
            errorCallback(errors) {
                util.writeError(err, "Watcher Pgx Error");
                stop();
            },
            excludedPaths: [libraryFolder]
        })
            .then((watcher) => {
                watcherPgxFolder = watcher;
                return watcher.start();
            })
            .then(() => {
            });

        this.pgxWatcherHandler = (event) => {
            const filename = path.join(event.directory || event.newDirectory, event.file || event.newFile);
            if (!watcherEnabled) {
                return console.warn('├─> Ignore Change > ', EVENT_TYPE[event.action], filename);
            }
            if (event.action === nsfw.actions.DELETED && filename === pgxFolder)
                return stop();
            if (filename === pgxFolder)
                return;
            if (new RegExp(`library${'\\' + path.sep}.*\.(pgx|cpx)`).test(filename)) {
                return; //skip library folder.
            } else if (!util.isSmartfaceDesignFile(filename)) {
                return console.warn('├─> Skip Change > ', EVENT_TYPE[event.action], filename);
            }
            console.log('├─ ⏰ 📄 »', EVENT_TYPE[event.action], '« ', filename);
            //console.log('eventTrype:' + eventType + ' filename provided:' + filename);
            isExistsFileDir(uiFolder).then(res => {
                if (res.existing && res.dir) {
                    if (event.action === nsfw.actions.DELETED) {
                        watcherHandler.deleteScriptFile(filename);
                    }
                    else if (event.action === nsfw.actions.MODIFIED || event.action === nsfw.actions.RENAMED || event.action === nsfw.actions.CREATED) {
                        watcherHandler.changeHandler(filename).then(res => res);
                    }
                }
                else {
                    watcherHandler.transpileAllPgxFiles();
                }
            }, err => util.writeError(err, "isExistsFileDir"));
        };

        this.themesWatcherHandler = (event) => {
            const filename = path.join(event.directory || event.newDirectory, event.file || event.newFile);
            if (event.action === nsfw.actions.DELETED && event.directory === themesFolder)
                return stop();
            if (!util.isStyleDesignFile(filename)) {
                return console.warn('├─> Skip Change > ', EVENT_TYPE[event.action], filename);
            }
            ++themesGeneratorTaskCounter;
            setTimeout(_ => {
                if (--themesGeneratorTaskCounter === 0) {
                    console.log('├─ ⏰ 🎨 »', EVENT_TYPE[event.action], '« ', path.relative(path.dirname(themesFolder), filename));
                    generateStyles();
                }
            }, WATCHER_DELAY);
        };
        //First generations...
        // watcherHandler.transpileLibraryPgx(path.join(pgxFolder, LIBRARY_FILE_NAME));
        // watcherHandler.transpileAllPgxFiles();
        generateStyles();
    };

    const stop = (opt) => {
        var _opt = opt || {};
        if (status === WATCHER_STATUS.STOPPED) {
            return console.log("Watcher has already been stopped!");
        } !_opt.silent && util.writeError(new Error(`Check Following Folders Exist\n - ${pgxFolder}\n - ${themesFolder}`),
            status === WATCHER_STATUS.RUNNING ? "Watcher Unlink Error" : "Watcher Starting Error");
        status = WATCHER_STATUS.STOPPED;
        watcherPgxFolder.stop();
        watcherThemes.stop()
        pgxTimer && clearInterval(pgxTimer);
        themesTimer && clearInterval(themesTimer);
        libTranspilerTaskCounter = 0;
        themesGeneratorTaskCounter = 0;
        return !_opt.silent && callBack(null, status);
    };

    this.stop = stop;

    function generateStyles() {
        styleGeneration.generateStyles().then(res => { }, err => util.writeError(err, "Watcher -> Generating Styles Error"));
    }
}

module.exports = Watcher;
