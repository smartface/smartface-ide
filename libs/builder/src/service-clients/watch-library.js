const fs = require('fs');
const path = require('path');
const nsfw = require('@smartface/nsfw-prebuild');

const LibraryService = require("@smartface/library-reader");

const EVENT_TYPE = require('../core/event-type');

let watcher;
let timeout;
let watcherEnabled = true;

function watch(libraryFolder, handler) {
  watcher && watcher.stop();
  const cpxWatcherHandler = (event) => {
    const filename = path.join(event.directory || event.newDirectory, event.file || event.newFile);
    if (!watcherEnabled) {
      return console.warn('├─> Ignore Change > ', EVENT_TYPE[event.action], filename);
    }
    timeout && clearTimeout(timeout);
    timeout = setTimeout(() => {
      console.log('├─ ⏰ 📗 »', EVENT_TYPE[event.action], '« ', filename);
      LibraryService.read(libraryFolder, (e, res) => {
        handler(e, res);
      });
    }, 800);
  };

  nsfw(libraryFolder,
      (events) => {
          events.forEach(e => cpxWatcherHandler(e));
      }, {
      errorCallback(errors) {
          util.writeError(errors, "Watcher Library Error");
          stop();
      }
  })
    .then((_watcher) => {
      watcher = _watcher;
      return watcher.start();
    })
    .then(() => {
    });

  fs.readdir(libraryFolder, (e, files) => {
    if (e) {
      return handler(e);
    }
    // first call
    LibraryService.read(libraryFolder, (e, res) => {
      handler(e, res);
    });
  });
}

function setWatcherEnabledStatus(enabled) {
  watcherEnabled = enabled;
}

module.exports = {
  watchLibrary: watch,
  setWatcherEnabledStatus
};
