const fse = require('fs-extra')

export const mkdirpSync = (dest: string) => {
    return fse.ensureDirSync(dest);
};

export const mkdirpAsync = (dest: string) => {
    return new Promise((resolve, reject) => {
        fse.ensureDir(dest, err => {
            if(err){
                reject(err);
            }else{
                resolve(null);
            }
        });
    });
};