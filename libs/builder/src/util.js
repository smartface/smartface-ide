const fs = require('fs-extra');
const path = require('path');
const request = require('http').request;

const rmdir = require('rmdir');
const jsonlint = require('jsonlint');
const dot = require('dot-object');
const bytes = require('bytes');

const OK = 200;
const SMARTFACE_DESİGN_REGEXP = /\.(pgx|cpx)/;
const STYLE_DESIGN_REGEXP = /\.json/;

/**
 * @function beautyTime
 * prepare beauty string for time.
 * @param secs {Number} seconds.
 * @return {string} string of time.
 */
function beautyTime(secs) {
  secs = Math.round(secs - 1);
  var hours = Math.floor(secs / (60 * 60));

  var divisor_for_minutes = secs % (60 * 60);
  var minutes = Math.floor(divisor_for_minutes / 60);

  var divisor_for_seconds = divisor_for_minutes % 60;
  var seconds = Math.ceil(divisor_for_seconds);

  var res = '';
  if (secs > 0) {
    appendTimeStr(hours, 'hour');
    appendTimeStr(minutes, 'min');
    appendTimeStr(seconds, 'sec');
  } else {
    res = ' less than a second';
  }

  return res;

  function appendTimeStr(val, str) {
    if (val) {
      res += val + ' ' + str;
    }
    if (val > 1) {
      res += 's';
    }
    res += ' ';
  }
}

/**
 * @function createSafeDir
 * remove and create directory.
 * @param path {string} path of directory that will be created.
 * @return {promise} result of promise.
 */
function createClearDir(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      var createDir = false;
      if (err) {
        // if it does not exist
        createDir = true;
      } else {
        if (!stats.isDirectory()) {
          createDir = true;
        }
      }
      if (createDir) {
        mkdirpSync(path);
        resolve('Directory is created -> ' + path);
      } else {
        rmdir(path, _err => {
          if (_err) {
            err.file = path;
            reject(err);
          } else {
            mkdirpSync(path);
            resolve('Directory is removed & created -> ' + path);
          }
        });
      }
    });
  });
}
/**
 * @function createUniqeTempDir
 * create temp directory.
 * @param prePath {string} pre path of tempDirectory that will be created.
 * @return {promise} result of promise.
 */
function createUniqeTempDir(prePath) {
  return new Promise((resolve, reject) => {
    fs.mkdtemp(prePath, (err, folder) => {
      if (!err) {
        resolve(folder);
      } else {
        reject(err);
      }
    });
  });
}

// safety creating directories.
function mkdirpSync(pathStr) {
  var unvalidDirname = [];
  // first occurence valid directory.
  function getValidDirname(pathString) {
    const dirname = path.dirname(pathString);

    if (dirname === '.' || fs.existsSync(dirname)) {
      unvalidDirname.push(
        pathString.substring(pathString.lastIndexOf(path.sep)).replace(/\\|\//gm, '')
      );
      return dirname;
    }
    unvalidDirname.push(
      pathString.substring(pathString.lastIndexOf(path.sep)).replace(/\\|\//gm, '')
    );
    return getValidDirname(path.dirname(pathString));
  }
  var res = false;
  var normalPath = path.normalize(pathStr);
  var validDirname = getValidDirname(normalPath);
  if (validDirname !== '.') {
    unvalidDirname.reverse().forEach(function(item) {
      validDirname = validDirname + path.sep + item;
      if (!fs.existsSync(validDirname)) {
        fs.mkdirSync(validDirname);
        res = true;
      }
    });
  }
  return res;
}

/**
 * @function isExistsFileDir
 * control for existing file or dir
 * @param prePath {string} pre path of tempDirectory that will be created.
 * @return {promise} stats of file  promise.
 */
function isExistsFileDir(path) {
  var res = {
    dir: false,
    existing: false,
    file: false
  };
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (!err) {
        res.dir = stats.isDirectory();
        res.file = stats.isFile();
        res.existing = true;
        resolve(res);
      } else if (err && err.code !== 'ENOENT') {
        err.file = path;
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function lowercaseFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

function ArrNoDupe(a) {
  var temp = {};
  for (var i = 0; i < a.length; i++) temp[a[i]] = true;
  var r = [];
  for (var k in temp) r.push(k);
  return r;
}

function readPgx(filePath) {
  return new Promise((resolve, reject) => {
    isExistsFileDir(filePath).then(
      res => {
        if (res.existing && res.file) {
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (!err) {
              if (!data) return resolve(null);
              try {
                resolve(jsonlint.parse(data));
              } catch (ex) {
                reject(
                  Object.assign(
                    new Error('PGX JSON Parse Error \n' + ex.toString().replace(/\n/gm, '\n\t')),
                    { file: filePath }
                  )
                );
              }
            } else {
              reject(Object.assign(new Error('PGX readFile'), { file: filePath }));
            }
          });
        } else {
          reject(new Error('PGX File ENOENT' + filePath));
        }
      },
      err => {
        console.log(err.toString());
        return resolve(null);
      }
    );
  });
}

function readRouterFile(filePath) {
  return new Promise((resolve, reject) => {
    isExistsFileDir(filePath).then(
      res => {
        if (res.existing && res.file) {
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (!err) {
              if (!data) return resolve(null);
              try {
                resolve(jsonlint.parse(data));
              } catch (ex) {
                reject(
                  Object.assign(
                    new Error('Router JSON Parse Error \n' + ex.toString().replace(/\n/gm, '\n\t')),
                    { file: filePath }
                  )
                );
              }
            } else {
              reject(Object.assign(new Error('Router readFile'), { file: filePath }));
            }
          });
        } else {
          reject(new Error('Router File ENOENT' + filePath));
        }
      },
      err => {
        console.log(err.toString());
        return resolve(null);
      }
    );
  });
}

function readJSON(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (!err) {
        if (!data) return resolve(null);
        try {
          resolve(jsonlint.parse(data));
        } catch (ex) {
          reject(
            Object.assign(
              new Error('JSON File Parse Error \n' + ex.toString().replace(/\n/gm, '\n\t')),
              { file: filePath }
            )
          );
        }
      } else {
        reject(Object.assign(new Error('Read JSON File'), { file: filePath }));
      }
    });
  });
}

function removeFile(filePath) {
  return new Promise((resolve, reject) => {
    isExistsFileDir(filePath).then(res => {
      if (res.existing) {
        if (res.file) {
          fs.unlink(filePath);
          resolve(true);
        } else {
          rmdir(filePath);
          resolve(true);
        }
      } else {
        resolve(false);
      }
    }, reject);
  });
}

function writeError(err, header) {
  var msg =
    '├─ ️☠️ ──────────── ' +
    (header || 'Generation Error') +
    '  ──────────────────' +
    (err.file ? '\n├─ file ─ ' + err.file : '') +
    '\n├─ » ' +
    (err.stack ? err.stack.toString('binary') : err.toString('binary'))
      .replace(/\n/gi, '\n├─ » ')
      .replace(/Error:/g, '\t');
  // logToDispatcher("error", msg);
  console.error(msg);
}

//return object ob2 - obj1
function getDiffAsObject(_obj1, _obj2) {
  const obj1 = dot.dot(_obj1 || {}),
    obj2 = dot.dot(_obj2 || {});
  var res = {};
  var mixedObj = Object.assign({}, obj2, obj1);

  for (var key in mixedObj) {
    if (obj2[key] !== obj1[key]) res[key] = obj2[key] || null;
  }

  return dot.object(res);
}

function sortComponents(components) {
  var componentObj = {};
  components.forEach(item => (componentObj[item.id] = item));

  components.forEach(item => (item.degree = getDegree(item.props.parent, componentObj)));

  function sortComponents(a, b) {
    var parentA = componentObj[a.props.parent],
      parentB = componentObj[b.props.parent],
      compADegree = a.degree,
      compBDegree = b.degree;

    if (compADegree !== compBDegree) return compADegree - compBDegree;
    else if (!parentA && parentB) return -1;
    else if (parentA && !parentB) return 1;
    else if (!parentA && !parentB) return 0;

    var indexA = parentA.props.children.indexOf(a.id),
      indexB = parentB.props.children.indexOf(b.id);

    return indexA - indexB;
  }

  components.sort(sortComponents);
}

function writeMemUsage() {
  var mem = process.memoryUsage();
  console.log('\n------------- MEM USAGE ------------ ');
  console.log(
    'RSS ---------> ',
    bytes(mem.rss, {
      unitSeparator: ' '
    })
  );
  console.log(
    'HeapTOTAL ---> ',
    bytes(mem.heapTotal, {
      unitSeparator: ' '
    })
  );
  console.log(
    'heapUSED ----> ',
    bytes(mem.heapUsed, {
      unitSeparator: ' '
    })
  );
  console.log(
    'external ----> ',
    bytes(mem.external, {
      unitSeparator: ' '
    })
  );
  console.log('-----------------------------------');
}

function getDegree(parent, componentObj) {
  if (parent && componentObj[parent]) {
    return 1 + getDegree(componentObj[parent].props.parent, componentObj);
  }
  return 0;
}

function getFamilyTree(componentByID, comp) {
  var res = comp ? [comp.props.name] : [];
  if (comp && comp.props.parent) {
    return res.concat(getFamilyTree(componentByID, componentByID[comp.props.parent]));
  }
  return res;
}

function logToDispatcher(level, msg, cb) {
  return cb && cb();
  //TODO fix socket hang up error
  // const req = request({
  //   method: "POST",
  //   host: "localhost",
  //   port: 8081,
  //   path: `/log/${level}/transpiler`
  // }, res => {
  //   if (res.statusCode !== OK)
  //     console.error(res.statusCode, " : ", res.statusMessage);
  //   cb && cb(res);
  // });
  // try {
  //   req.write(msg);
  //   req.end();
  // }
  // catch (e) {
  //   console.error("LogToDispatcher: ", e);
  // }
}

function isSmartfaceDesignFile(filename) {
  return SMARTFACE_DESİGN_REGEXP.test(filename);
}

function isSmartfaceRouterDesignFile(filename) {
  return SMARTFACE_DESİGN_REGEXP.test(filename);
}

function isStyleDesignFile(filename) {
  return STYLE_DESIGN_REGEXP.test(filename);
}

module.exports = {
  beautyTime: beautyTime,
  createClearDir: createClearDir,
  createUniqeTempDir: createUniqeTempDir,
  isExistsFileDir: isExistsFileDir,
  mkdirpSync: mkdirpSync,
  capitalizeFirstLetter: capitalizeFirstLetter,
  ArrNoDupe: ArrNoDupe,
  readPgx: readPgx,
  readRouterFile,
  readJSON,
  writeError: writeError,
  removeFile: removeFile,
  getDiffAsObject: getDiffAsObject,
  sortComponents: sortComponents,
  lowercaseFirstLetter: lowercaseFirstLetter,
  writeMemUsage: writeMemUsage,
  getDegree: getDegree,
  getFamilyTree: getFamilyTree,
  logToDispatcher: logToDispatcher,
  isSmartfaceDesignFile,
  isSmartfaceRouterDesignFile,
  isStyleDesignFile
};
