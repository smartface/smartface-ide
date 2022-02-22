"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLibraryPageWithChildren = exports.createLibDirFile = exports.saveComponents = exports.read = void 0;
var path = require("path");
var fs = require("fs");
var queue = require("async/queue");
var LIB_NAME = '__library__';
var LIB_FILE_NAME = 'index.pgx';
var CONCURRENCY = 15;
var SMARTFACE_DESİGN_REGEXP = /\.(pgx|cpx)/;
var componentNameMap = {};
function isSmartfaceDesignFile(filename) {
    return SMARTFACE_DESİGN_REGEXP.test(filename);
}
function createLibraryFile(libFolderPath, data, callback) {
    var libIndexFilePath = path.join(libFolderPath, LIB_FILE_NAME);
    fs.stat(libIndexFilePath, function (e, stat) {
        if (!stat || stat.isDirectory()) {
            return fs.writeFile(libIndexFilePath, data, 'utf8', callback);
        }
        return callback(e);
    });
}
function create(libFolderPath, data, callback) {
    fs.stat(libFolderPath, function (e, stat) {
        if (!stat || !stat.isDirectory()) {
            fs.mkdir(libFolderPath, function (err) {
                if (err)
                    return callback(err);
                return createLibraryFile(libFolderPath, data, callback);
            });
        }
        return createLibraryFile(libFolderPath, data, callback);
    });
}
function read(libFolderPath, callback) {
    var libPageComps = [];
    var pageChildren = [];
    var components = [];
    var rootComps = [];
    componentNameMap = {};
    fs.readdir(libFolderPath, function (readDirErr, files) {
        if (readDirErr) {
            return callback(new Error("Library folder reading error: " + libFolderPath + readDirErr.toString()));
        }
        var q = queue(function (file, next) {
            fs.readFile(path.join(libFolderPath, file), 'utf8', function (readFileErr, content) {
                if (readFileErr)
                    return next(readFileErr);
                var comps;
                try {
                    comps = JSON.parse(content).components;
                }
                catch (e) {
                    console.error("Invalid .cpx file -> " + file + " ->", e);
                    return next(e);
                }
                if (comps[0]) {
                    if (comps[0].props.name === LIB_NAME) {
                        libPageComps = comps;
                    }
                    else {
                        componentNameMap[comps[0].props.name] = true;
                        pageChildren.push(comps[0].id);
                        components = components.concat(comps);
                        rootComps.push(comps[0]);
                    }
                }
                return next();
            });
        }, CONCURRENCY);
        // assign a callback
        q.drain = function () {
            if (libPageComps[0]) {
                rootComps.forEach(function (rootComp) {
                    // eslint-disable-next-line no-param-reassign
                    rootComp.props.parent = libPageComps[0].id;
                });
                libPageComps[0].props.children = libPageComps[0].props.children.concat(rootComps
                    .sort(function (a, b) {
                    if (a.props.name.toLowerCase() < b.props.name.toLowerCase()) {
                        return -1;
                    }
                    if (a.props.name.toLowerCase() > b.props.name.toLowerCase()) {
                        return 1;
                    }
                    return 0;
                })
                    .map(function (comp) { return comp.id; }));
                callback(null, libPageComps.concat(components));
            }
            else
                callback(new Error('Library page component does not exist'));
        };
        q.push(files.filter(isSmartfaceDesignFile) || [], function (err) {
            if (err) {
                console.error('an error occured while components collecting!', err);
                return callback(err);
            }
        });
        return null;
    });
}
exports.read = read;
function getLibraryPageWithChildren(libFolderPath, componentsWithChildren, cb) {
    fs.readFile(path.join(libFolderPath, LIB_FILE_NAME), function (readFileErr, data) {
        var pageComps;
        var components = [];
        if (readFileErr)
            return cb(readFileErr);
        try {
            pageComps = JSON.parse(data.toString()).components;
        }
        catch (e) {
            return cb(e);
        }
        componentsWithChildren.forEach(function (comps) {
            pageComps[0].props.children.push(comps[0].id);
            // eslint-disable-next-line no-param-reassign
            comps[0].props.parent = pageComps[0].id;
            components = components.concat(comps);
        });
        return cb(null, pageComps.concat(components));
    });
}
exports.getLibraryPageWithChildren = getLibraryPageWithChildren;
function saveComponents(libFolderPath, componentsWithChildren, callback, ignoreDeletion) {
    if (ignoreDeletion === void 0) { ignoreDeletion = false; }
    if (!ignoreDeletion)
        deactiveLibComps();
    var errorHolder;
    var q = queue(function (comps, next) {
        var name = comps[0].props.name;
        if (!ignoreDeletion)
            componentNameMap[name] = true;
        writeOneComponent(getCompFilePath(libFolderPath, name), comps, next);
    }, CONCURRENCY);
    q.drain = function () {
        if (!ignoreDeletion) {
            var q2 = queue(function (key, next) {
                removeUnusedComp(getCompFilePath(libFolderPath, key), next);
                delete componentNameMap[key];
            }, CONCURRENCY);
            q2.drain = function () { return callback(errorHolder); };
            q2.push(Object.keys(componentNameMap).filter(function (key) { return componentNameMap[key] !== true; }));
        }
        return callback(errorHolder);
    };
    q.push(componentsWithChildren || [], function (err) {
        errorHolder = err;
        if (err)
            console.error('an error occured while components saving..!', err);
    });
}
exports.saveComponents = saveComponents;
function getCompFilePath(folderPath, fileName) {
    return path.join(folderPath, fileName + ".cpx");
}
function removeUnusedComp(filePath, callback) {
    fs.unlink(filePath, callback);
}
function deactiveLibComps() {
    Object.keys(componentNameMap).forEach(function (key) {
        componentNameMap[key] = false;
    });
}
function writeOneComponent(fileName, components, callback) {
    fs.writeFile(fileName, JSON.stringify({ components: components }, null, '\t'), 'utf8', callback);
}
var createLibDirFile = create;
exports.createLibDirFile = createLibDirFile;
