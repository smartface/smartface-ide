import { writeFile } from 'fs';

export enum STATUS {
  'init' = 'init',
  'compiling' = 'compiling',
  'error' = 'error',
  'compiled' = 'compiled',
}

let statusJson: { status: STATUS } = {
  status: STATUS.init,
};
let jsonFilePath;

async function writeJSON(json: any) {
  return new Promise((resolve, reject) => {
    writeFile(jsonFilePath, JSON.stringify(json, null, '\t'), err => {
      if (err) return reject(err);
      resolve('');
    });
  });
}

export async function initStatusFile(_jsonFilepath: string) {
  jsonFilePath = _jsonFilepath;
  return writeJSON(statusJson);
}

export async function changeStatus(status: STATUS) {
  statusJson.status = status;
  return writeJSON(statusJson);
}