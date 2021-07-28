const fs = require('fs-extra');
const MAX_TRY_NUM = 200;

module.exports = (function() {

    const _fileStatus = {};

    function readFile(path, encoding, callback, count) {
        count = count || 1;
        if (isReadyForFileoperation(path)){
            setFileStatusBusy(path);
            fs.readFile(path, encoding, function(err, data){
                setFileStatusReady(path);
                callback(err, data);
            });
        }else if((count < MAX_TRY_NUM )){
            setTimeout(readFile.bind(null, path, encoding, callback, ++count), 200);
        }else{
            callback(new Error("File is busy TIMEOUT_> 40 seconds"));
        }
    }
    
    function writeFile(path, data, encoding, callback, count){
        count = count || 1;
        if (isReadyForFileoperation(path)){
            setFileStatusBusy(path);
            fs.writeFile(path, data, encoding, function(err){
                setFileStatusReady(path);
                callback(err);
            });
        }else if((count < MAX_TRY_NUM )){
            setTimeout(writeFile.bind(null, path, data, encoding, callback, ++count), 200);
        }else{
            callback(new Error("File is busy TIMEOUT_> 40 seconds"));
        }
    }
    
    function readJson(path, callback, count){
        count = count || 1;
        if (isReadyForFileoperation(path)){
            setFileStatusBusy(path);
            fs.readJson(path, function(err, packageObj){
                setFileStatusReady(path);
                callback(err, packageObj);
            });
        }else if((count < MAX_TRY_NUM )){
            setTimeout(readJson.bind(null, path, callback, ++count), 200);
        }else{
            callback(new Error("File is busy TIMEOUT_> 40 seconds"));
        }
    }

    function isReadyForFileoperation(path) {
        return !_fileStatus[path];
    }
    
    
    function setFileStatusBusy(path){
        _fileStatus[path] = true;
    }
    
    function setFileStatusReady(path){
       delete _fileStatus[path];
    }

    return {
        readFile: readFile,
        writeFile: writeFile,
        readJson: readJson
    };
})();
