const Workspace = require('../../workspace/workspace');
const execFile = require('child_process').execFile;
const gifsicle = require('gifsicle');
const baseImageServePath = "/ui-editor/img";
const path = require("path");
const fs = require('fs');
const Jimp = require('jimp');
const gifFrames = require('gif-frames');
const LogToConsole = require('../../common/LogToConsole');
const mkdirpAsync = require('../../util/mkdirp').async;
const getRandomName = require('../../util/getRandomName');
const CONSTANTS = require("../../constants");

const IMAGE_FORMAT = {
    "png": Jimp.MIME_PNG || 'image/png'
};
module.exports = function(app, options) {
    options = options || {};
    var log = new LogToConsole(options.logToConsole, '[IMAGE]').log;
    var wsPath = CONSTANTS.WORKSPACE_PATH;
    var tempPath = path.join(CONSTANTS.WORKSPACE_PATH, ".tmp");
    app.get(baseImageServePath + "/:imageName", function(req, res, next) {
        var device = {
                os: req.query.os,
                screen: {
                    dp: req.query.density
                },
                brandModel: req.query.brandModel
            },
            densityRatio = req.query.densityRatio || 1;
        try {
            if (req.query.resourceFolderOrder) {
                var resourceFolderOrder = req.query.resourceFolderOrder.split(",");
                for (var i = 0; i < resourceFolderOrder.length; i++) {
                    resourceFolderOrder[i] = "\"" + resourceFolderOrder[i] + "\"";
                }
                var functionBody = "return [" + resourceFolderOrder + "];";
                var fn = new Function(functionBody);
                device.resourceFolderOrder = fn();
            }
        }
        catch (ex) {
            debugger;
        }

        var zoomLevel = Number(req.query.zoomLevel) || 1;
        var ws = new Workspace({
            path: wsPath,
            projectID: process.env.C9_HOSTNAME
        });
        var imageName = req.params.imageName;
        var imageFormat = getImageFormat(imageName);

        if (imageFormat === "gif")
            serveGifImage(req.query, path.join(wsPath, "assets", imageName), densityRatio, zoomLevel, res);
        else if (imageName !== "*") {
            ws.getImage(device, req.params.imageName,
                function indexResult(err, index) {
                    if (err)
                        return handleError(err, res);
                    var found = !!(index && Object.keys(index) && Object.keys(index)[0]);
                    if (found) {
                        var filePath = Object.keys(index)[0];
                        //var fileInfo = index[filePath];
                        sendImageBuffer(filePath, densityRatio, zoomLevel, imageFormat, res);

                    }
                    else {
                        res.sendStatus(404);
                    }
                });
        }
        else {
            ws.getImage(device, req.params.imageName,
                function indexResultAll(err, index) {
                    if (err)
                        return handleError(err, res);
                    var result = {};
                    for (var p in index) {
                        var item = index[p];
                        item.path = p;
                        var parsedPath = path.parse(p);
                        var key = parsedPath.name.split("@")[0] + parsedPath.ext;
                        result[key] = item;
                    }
                    res.json(result);
                }, false);
        }
    });

    function serveGifImage(query, filePath, densityRatio, zoomLevel, response) {
        let tempGifFile = path.join(tempPath, getRandomName(".gif"));
        mkdirpAsync(tempPath).then(() => {});
        execFile(gifsicle, ['--scale', zoomLevel, '-o', tempGifFile, filePath], err => {
            if (err)
                return handleError(err, response);
            if (query.frame !== undefined) {
                gifFrames({ url: tempGifFile, frames: query.frame, utputType: 'png' }).then(function(frameData) {
                    //response.writeHead(200, { 'Content-Type': 'image/png' });
                    let readable = frameData[0].getImage();
                    response.contentType('image/png');
                    readable.pipe(response);
                    fs.unlink(tempGifFile);
                });
            }
            else {
                fs.readFile(tempGifFile, (err, data) => {
                    if (err)
                        return handleError(err, response);
                    sendData(data, "gif", response);
                    fs.unlink(tempGifFile);
                });
            }
        });
    }

    function sendImageBuffer(source, densityRatio, zoomLevel, imageFormat, response) {
        Jimp.read(source, function(err, image) {
            if (err)
                return handleError(err, response);
            image.scale(densityRatio * zoomLevel /** fileInfo.scaleWith*/ , function(err, image) {
                if (err)
                    return handleError(err, response);
                image.getBuffer(IMAGE_FORMAT[imageFormat] || Jimp.AUTO, function(err, buffer) {
                    if (err)
                        return handleError(err, response);
                    sendData(buffer, imageFormat, response);
                });
            });
        });
    }

    function sendData(data, imageFormat, response) {
        response.type(imageFormat).
        set({
            "Pragma-directive": "no-cache",
            "Cache-directive": "no-cache",
            "Cache-control": "no-cache",
            "Pragma": "no-cache",
            "Expires": "0",
        }).
        send(data);
    }

    function getImageFormat(filePath) {
        return path.parse(filePath).ext.substr(1).toLowerCase();
    }

    function handleError(err, response) {
        response.sendStatus(500);
        response.end(err.stack || err);
        log("[ERROR]", err);
    }
};
