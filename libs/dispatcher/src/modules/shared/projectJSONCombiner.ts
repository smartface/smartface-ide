import { readdir, readFile } from 'fs';
import { ProjectJSONType } from '../../core/WorkspaceIndexTypes';

export var cache = {
  enabled: true,
  duration: 1000,
  projectJSON: null,
  stamp: null,
};

function forIn(o, fn, thisArg) {
  for (var key in o) {
    if (fn.call(thisArg, o[key], key, o) === false) {
      break;
    }
  }
}

function isExtendable(val) {
  return (
    typeof val !== 'undefined' &&
    val !== null &&
    (typeof val === 'object' || typeof val === 'function')
  );
}

function mixinDeep(target, objects) {
  var len = arguments.length,
    i = 0;
  while (++i < len) {
    var obj = arguments[i];
    if (isObject(obj)) {
      forIn(obj, copy, target);
    }
  }
  return target;
}

/**
 * Copy properties from the source object to the
 * target object.
 *
 * @param  {*} `val`
 * @param  {String} `key`
 */

function copy(val, key) {
  var obj = this[key];
  if (isObject(val) && isObject(obj)) {
    mixinDeep(obj, val);
  } else {
    this[key] = val;
  }
}

/**
 * Returns true if `val` is an object or function.
 *
 * @param  {any} val
 * @return {Boolean}
 */

function isObject(val) {
  return isExtendable(val) && !Array.isArray(val);
}

async function combineProjectJSON(configPath: string): Promise<ProjectJSONType> {
  var reProjectJSON = /project(\.\w+)?\.json/;
  return new Promise((resolve, reject) => {
    readdir(configPath, (err, list) => {
      if (err) {
        return reject(err);
      }

      var projectJSONFiles = [];

      list.forEach(function(name) {
        reProjectJSON.lastIndex = 0;
        reProjectJSON.test(name) && projectJSONFiles.push(getPath(configPath, name));
      });

      var projectJSON = {};
      function readNextFile(cb) {
        var fileToRead = projectJSONFiles.pop();
        if (!fileToRead) {
          cb(null, projectJSON);
          return;
        }
        readFile(fileToRead, 'utf8', function(err, data) {
          if (err) {
            cb(err);
            return;
          }
          var obj;
          try {
            obj = JSON.parse(data);
          } catch (ex) {
            ex.currentFile = fileToRead;
            cb(ex);
            return;
          }
          projectJSON = mixinDeep(projectJSON, obj);
          readNextFile(cb);
        });
      }

      readNextFile(function(err, projectJSON) {
        if (!err) {
          cache.stamp = new Date();
          cache.projectJSON = projectJSON;
          resolve(projectJSON);
        } else {
          return reject(err);
        }
      });
    });
  });
}

export async function getProjectJSON(configPath): Promise<ProjectJSONType | Error> {
  if (cache.enabled && cache.stamp) {
    var currentDate = new Date();
    var difference = Number(currentDate) - Number(cache.stamp);
    if (difference <= cache.duration) {
      return cache.projectJSON;
    } else {
      return combineProjectJSON(configPath);
    }
  } else {
    return combineProjectJSON(configPath);
  }
}

function getPath(base: string, file: string) {
  /*if (typeof module === "object")
            return file;*/
  return base + '/' + file;
}
