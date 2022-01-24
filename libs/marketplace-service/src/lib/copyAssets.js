const queue = require('async/queue');
const path = require("path");

const copyAsync = require("../util/copy").async;

const CONCURRENCY = 20;
module.exports = (assetList, destFolder, option) => {
    return new Promise((resolve, reject) => {
        var q = queue((oneAsset, cb) => {
            //console.dir(oneAsset);
            copyAsync(oneAsset.src, path.join(destFolder, oneAsset.relPath), 
            Object.assign({},option, {isRelPathFull: oneAsset.isRelPathFull}))
            .then(res => cb(), cb);
        }, CONCURRENCY);

        // assign a callback
        q.drain = function(err) {
            if(err)
                reject(err);
            else
                resolve("completed");
          //console.log("copyAssets completed. ", assetList.length);

        };
        q.push(assetList || []);
    });
};
