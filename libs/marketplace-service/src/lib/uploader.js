const fs = require('fs');
const path = require("path");
var https = require('https');

const FormData = require('form-data');
const bytes = require("bytes");
const colors = require("colors");
const ProgressInfo = require('./progressinfo.js');

const utility = require("../utility");



// upload to server.
/**
 * Upload files to server
 * @function upload
 * @param   {Array.string} array of files path that will be uploaded.
 * @param   {string} url that will be uploaded.
 * @param   {function} callback function err, response.
 * @returns { undefined } 
 */
function upload(files, options, callBack) {

    var CRLF = '\r\n';
    var taskCount = files.length;
    var form = new FormData();
    var totalBytes = 0;
    var elapsedTime = 0;
    var maximumCharacterNum = 12;
    var repeatCh = "=";
    var proginfo = null;
    https = options.https || https;
    // files md5
    function getHash(file) {
        /* md5File(file, function(err, res) {
             if (err)
                 throw err; */
        // hashes[path.basename(file)] = res;
        /*  
          var options = {
              headers: {
                  "Content-MD5": forge.util.encode64(forge.util.hexToBytes(res))
              },
              combiningHeaders: true
          };*/
        var name = path.basename(file);
        var fileStream = fs.createReadStream(file);
        fileStream.on("data", onData);
        form.append(name, fileStream);
        //console.log("File: " + file);
        getFilesizeInBytes(file, (err, res) => {
            if (err)
                throw err;
            totalBytes += res;
            //writeBeautifyInfo(res, path.basename(file));
            done();
        });
        // });
    }

    function onData(chunk) {
        proginfo.update(chunk.length);
    }

    //get size of file that given.
    function getFilesizeInBytes(filename, callBack) {
        fs.stat(filename, (err, stats) => {
            if (err)
                return callBack(err);
            var fileSizeInBytes = stats["size"];
            callBack(null, fileSizeInBytes);
        });
    }

    //measure speed, MB/s 
    function measureSpeed() {
        //console.log("elapsedTime: " + elapsedTime);
        return (((totalBytes) / (elapsedTime / 1000)));
    }

    function writeBeautifyInfo(res, file) {
        var str = bytes(res, {
            unitSeparator: ' ',
            thousandsSeparator: ' '
        });
        str += " " + repeatCh.repeat(maximumCharacterNum - str.length) + "> ";
        utility.writeMessage(str + file);
    }


    // remote async functions. 
    function done() {
        --taskCount;
        if (taskCount !== 0)
            return;
        startUpload();
    }

    // initializing upload call basic functions.
    function initilazeForUpload() {
        files.forEach(function(file) {
            if (file.key) {
                form.append(file.key, file.value);
                //console.dir(file);
                done();
            }
            else
                getHash(file);
        });
    }

    // now files ready for uploading ..
    function startUpload() {
        //console.inspect(form);
        //console.inspect(form.getHeaders());
        //form.submit(url,callBack);
        Object.assign(options.headers, form.getHeaders());
        //form.submit(options, callBack);
        //control request.
        /*var options = {
            host: "requestb.in",
            path: "/scq3tdsc",
            headers: {
                Authorization: "awdsadasdasdasd"
            },
            method: "post"
        };
        Object.assign(options.headers,form.getHeaders());
        */
        var request = https.request(options);
        //console.log("RequestOptions: ",  JSON.stringify(options, null, "\t"));

        form.pipe(request);
        /*utility.writeJsonMsgToStdout("The total size of the files to be uploaded  : " + colors.yellow(bytes(totalBytes, {
            unitSeparator: ' ',
            thousandsSeparator: ' '
        })));*/
        utility.writeMessage("Starting upload...");
        var time = new Date();
        proginfo = new ProgressInfo(totalBytes, "Uploading", writer);
        proginfo.start();
        //console.time("Upload");
        request.on('response', function(res) {
            elapsedTime = new Date() - time;
            //console.timeEnd("Upload");
            var str = '';
            res.on("data", function(chunk) {
                str += chunk;
            });
            res.on("end", function() {
                setTimeout(() => {
                    if (res.statusCode !== 202 && res.statusCode !== 200) {
                        res.msg = res.statusCode + " : " + res.statusMessage;
                        res.err = "Upload Error";
                        res.detail = getDetailMessage(str);
                        return callBack({
                            msg: res.statusCode + " : " + res.statusMessage,
                            err: "Upload Error",
                            stack: getDetailMessage(str)
                        });
                    }
                    else {
                        utility.writeMessage("Uploading complete   : " + ProgressInfo.beautyTime(elapsedTime / 1000));
                        utility.writeMessage("Avarage upload speed : " + bytes(measureSpeed(), {
                            unitSeparator: ' ',
                            thousandsSeparator: ' '
                        }) + "/s");
                        callBack(null, str);
                    }
                }, 1001);
            });
        });

        request.on('error', callBack);

        proginfo.onFinish = function() {
            utility.writeMessage("Awaiting response...");
        };
    }

    initilazeForUpload();
}

function writer(data) {
    if (false) {
        utility.writeMessage(data.replace(/\s+/g, " "));
    }
    else {
        process.stdout.write(data);
    }
}

function getDetailMessage(rawMesage) {
    var msg;
    try {
        msg = JSON.parse(rawMesage).message || JSON.parse(rawMesage).Message;
    }
    catch (e) {}
    finally {
        !msg && (msg = rawMesage);
    }
    return msg;
}

module.exports = upload;

/*upload(['/home/ubuntu/workspace/workspace/content.zip','/home/ubuntu/workspace/workspace/README.md'],'https://portalapi.smartface.io',function(err, res){
    
    console.inspect(res);
    console.inspect(err);
});*/
