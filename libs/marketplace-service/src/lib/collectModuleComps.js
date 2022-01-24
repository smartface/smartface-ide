const fs = require("fs");
const path = require("path");

const queue = require('async/queue');
const CONCURRENCY = 15;

module.exports = (sfModulesPath) => {
    return new Promise((resolve, reject) => {
        var modules = [];
        var q = queue((moduleName, cb) => {
            fs.readFile(path.join(sfModulesPath,moduleName,"view.json"),"utf-8",
            (err, data) => {
                if(err)
                    return cb();
                try{
                    modules.push(JSON.parse(data));
                }catch(e){
                    e.err = "Module Parse Error";
                    return cb(e);
                }
                cb();
            });
        }, CONCURRENCY);

        // assign a callback
        q.drain = function(err) {
            if(err)
                reject(err);
            else
                resolve(modules);
          //console.log("copyAssets completed. ", assetList.length);

        };
        q.push(fs.readdirSync(sfModulesPath) || []);
    });
};