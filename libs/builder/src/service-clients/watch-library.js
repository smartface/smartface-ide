const LibraryService = require("@smartface/library-reader");
const chokidar = require('chokidar');
const fs = require('fs');

let watcher;
let timeout;

function watch(libraryFolder, handler) {
  watcher && watcher.close();
  watcher = chokidar.watch(`${libraryFolder}/*.!(pgx)cpx`, {
    ignoreInitial: false,
  });
  let readCounter = 0;
  fs.readdir(libraryFolder, (e, files) => {
    if (e) {
      return handler(e);
    }
    if (!files.some(f => f.endsWith('.cpx'))) {
      return LibraryService.read(libraryFolder, (e, res) => {
        handler(e, res);
      });
    }
    watcher.on('all', (e, filename) => {
      timeout && clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.log('Watcher ..> ', e, ' . ', filename);
        LibraryService.read(libraryFolder, (e, res) => {
          handler(e, res);
        });
      }, 800);
    });
  });
}

module.exports = watch;
