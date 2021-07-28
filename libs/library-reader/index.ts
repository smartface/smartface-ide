import * as path from 'path';
import * as fs from 'fs';
import * as queue from 'async/queue';

const LIB_NAME = '__library__';
const LIB_FILE_NAME = 'index.pgx';
const CONCURRENCY = 15;
let componentNameMap: Record<string, any> = {};

type Callback<T = boolean | string> = (err: Error | null, resp?: T) => void;

function createLibraryFile(
  libFolderPath: string,
  data: string,
  callback: fs.NoParamCallback
) {
  const libIndexFilePath = path.join(libFolderPath, LIB_FILE_NAME);
  fs.stat(libIndexFilePath, (e, stat) => {
    if (!stat || stat.isDirectory()) {
      return fs.writeFile(libIndexFilePath, data, 'utf8', callback);
    }

    return callback(e);
  });
}

function create(
  libFolderPath: string,
  data: string,
  callback: fs.NoParamCallback
) {
  fs.stat(libFolderPath, (e, stat) => {
    if (!stat || !stat.isDirectory()) {
      fs.mkdir(libFolderPath, (err) => {
        if (err) return callback(err);
        return createLibraryFile(libFolderPath, data, callback);
      });
    }
    return createLibraryFile(libFolderPath, data, callback);
  });
}

function read(libFolderPath: string, callback: Callback<Record<string, any>>) {
  let libPageComps: Record<string, any>[] = [];
  const pageChildren: any[] = [];
  let components: Record<string, any>[] = [];
  const rootComps: Record<string, Record<string, any>>[] = [];

  componentNameMap = {};

  fs.readdir(libFolderPath, (readDirErr, files) => {
    if (readDirErr) {
      return callback(
        new Error(
          `Library folder reading error: ${libFolderPath}${readDirErr.toString()}`
        )
      );
    }
    const q = queue((file, next) => {
      fs.readFile(
        path.join(libFolderPath, file),
        'utf8',
        (readFileErr, content) => {
          if (readFileErr) return next(readFileErr);
          let comps;
          try {
            comps = JSON.parse(content).components;
          } catch (e) {
            console.error(`Invalid .cpx file -> ${file} ->`, e);
            return next(e);
          }
          if (comps[0]) {
            if (comps[0].props.name === LIB_NAME) {
              libPageComps = comps;
            } else {
              componentNameMap[comps[0].props.name] = true;
              pageChildren.push(comps[0].id);
              components = components.concat(comps);
              rootComps.push(comps[0]);
            }
          }
          return next();
        }
      );
    }, CONCURRENCY);
    // assign a callback
    q.drain = () => {
      if (libPageComps[0]) {
        rootComps.forEach((rootComp) => {
          // eslint-disable-next-line no-param-reassign
          rootComp.props.parent = libPageComps[0].id;
        });
        libPageComps[0].props.children = libPageComps[0].props.children.concat(
          rootComps
            .sort((a, b) => {
              if (a.props.name.toLowerCase() < b.props.name.toLowerCase()) {
                return -1;
              }
              if (a.props.name.toLowerCase() > b.props.name.toLowerCase()) {
                return 1;
              }
              return 0;
            })
            .map((comp) => comp.id)
        );
        callback(null, libPageComps.concat(components));
      } else callback(new Error('Library page component does not exist'));
    };

    q.push(files || [], (err: Error) => {
      if (err) {
        console.error('an error occured while components collecting!', err);
        return callback(err);
      }
    });
    return null;
  });
}

function getLibraryPageWithChildren(
  libFolderPath,
  componentsWithChildren: Record<string, any>[],
  cb: Callback
) {
  fs.readFile(path.join(libFolderPath, LIB_FILE_NAME), (readFileErr, data) => {
    let pageComps;
    let components: Record<string, any>[] = [];
    if (readFileErr) return cb(readFileErr);
    try {
      pageComps = JSON.parse(data.toString()).components;
    } catch (e) {
      return cb(e);
    }
    componentsWithChildren.forEach((comps) => {
      pageComps[0].props.children.push(comps[0].id);
      // eslint-disable-next-line no-param-reassign
      comps[0].props.parent = pageComps[0].id;
      components = components.concat(comps);
    });
    return cb(null, pageComps.concat(components));
  });
}

function saveComponents(
  libFolderPath: string,
  componentsWithChildren: Record<string, any>[],
  callback: Callback<void>,
  ignoreDeletion: boolean = false
) {
  if (!ignoreDeletion) deactiveLibComps();
  let errorHolder: Error;
  const q = queue((comps, next) => {
    const { name } = comps[0].props;
    if (!ignoreDeletion) componentNameMap[name] = true;
    writeOneComponent(getCompFilePath(libFolderPath, name), comps, next);
  }, CONCURRENCY);
  q.drain = () => {
    if (!ignoreDeletion) {
      const q2 = queue((key, next) => {
        removeUnusedComp(getCompFilePath(libFolderPath, key), next);
        delete componentNameMap[key];
      }, CONCURRENCY);
      q2.drain = () => callback(errorHolder);
      q2.push(
        Object.keys(componentNameMap).filter(
          (key) => componentNameMap[key] !== true
        )
      );
    }
    return callback(errorHolder);
  };
  q.push(componentsWithChildren || [], (err) => {
    errorHolder = err;
    if (err) console.error('an error occured while components saving..!', err);
  });
}

function getCompFilePath(folderPath: string, fileName: string) {
  return path.join(folderPath, `${fileName}.cpx`);
}

function removeUnusedComp(filePath: string, callback: Callback) {
  fs.unlink(filePath, callback);
}

function deactiveLibComps() {
  Object.keys(componentNameMap).forEach((key) => {
    componentNameMap[key] = false;
  });
}

function writeOneComponent(
  fileName: string,
  components: Record<string, unknown>,
  callback: Callback
) {
  fs.writeFile(
    fileName,
    JSON.stringify({ components }, null, '\t'),
    'utf8',
    callback
  );
}

const createLibDirFile = create;

export { read, saveComponents, createLibDirFile, getLibraryPageWithChildren };
