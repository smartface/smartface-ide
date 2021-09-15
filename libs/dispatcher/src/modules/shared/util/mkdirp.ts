import  { execSync, exec } from 'child_process';

export const mkdirpSync = (dest: string) => {
    return execSync(`mkdir -p ${dest}`);
};

export const mkdirpAsync = (dest: string) => {
    return new Promise((resolve, reject) => {
        exec(`mkdir -p ${dest} `, (error, stdout, stderr) => {
            if (error || stderr)
                reject(error || stderr);
            else
                resolve(stdout);
        });
    });
};