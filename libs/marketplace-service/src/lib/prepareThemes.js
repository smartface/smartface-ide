const fs = require("fs");
const path = require("path");

const series = require('async/series');
const dotProp = require('dot-prop');

const mkdirpSync = require("../util/mkdirp").sync;
const rmrf = require("../util/rmrf").async;
const copyAssets = require("../lib/copyAssets");

module.exports.exportTheme = (classNameList, settingsPath, bundleThemesFolder, destThemeFolder, bundleName) => {
    return new Promise((resolve, reject) => {
        var activeTheme, resTheme,
            destPath = path.join(destThemeFolder, bundleName || "theme.json");
        series({
            taskGetActiveTheme: cb => {
                getConfigTheme(settingsPath)
                    .then(res => cb(null, activeTheme = res.currentTheme), cb);
            },
            taskCollectStyles: cb => {
                getStylesFromOneTheme(
                        path.join(bundleThemesFolder, activeTheme + ".json"),
                        classNameList)
                    .then(res => {
                        mkdirpSync(path.dirname(destPath));
                        resTheme = res;
                        cb();
                    }, cb);
            },
            taskWriteThemeFile: cb => {
                resTheme ?
                    fs.writeFile(destPath,
                        JSON.stringify(resTheme || {}, null, "\t"), cb) :
                    cb(null);
            }
        }, (err, res) => {
            if (err)
                return reject(err);
            resolve(resTheme);
        });
    });
};

module.exports.importTheme = (settingsPath, themePath, destThemeFolder) => {
    return new Promise((resolve, reject) => {
        var baseTheme;
        series({
            taskGetBaseTheme: cb => {
                getConfigTheme(
                        settingsPath)
                    .then(res => cb(null, baseTheme = res.baseTheme), cb);
            },
            taskWriteThemeFile: cb => {
                copyAssets({
                        src: themePath,
                        relPath: path.join(baseTheme, "styles", path.basename(themePath)),
                        isRelPathFull: true
                    },
                    destThemeFolder).then(res => cb(), cb);
            }
        }, (err, res) => {
            if (err)
                return reject(err);
            resolve(res);
        });
    });
};

module.exports.removeTheme = (settingsPath, wsThemeFolder, themeName) => {
    return new Promise((resolve, reject) => {
        var baseTheme;
        series({
            taskGetBaseTheme: cb => {
                getConfigTheme(
                        settingsPath)
                    .then(res => cb(null, baseTheme = res.baseTheme), cb);
            },
            taskRemoveLibrary: cb => {
                rmrf(path.join(wsThemeFolder, baseTheme, "styles", themeName))
                    .then(() => cb(), cb);
            }
        }, (err, res) => {
            if (err)
                return reject(err);
            resolve(res);
        });
    });
};

function getStylesFromOneTheme(themeFile, classNameList) {
    return new Promise((resolve, reject) => {
        fs.readFile(themeFile, "utf-8", (err, data) => {
            if (err) {
                err.file = themeFile;
                return reject(err);
            }
            var theme;
            var resTheme = {},
                partialClassName;
            try {
                theme = JSON.parse(data);
            }
            catch (e) {
                return reject(e);
            }
            //console.dir(JSON.stringify(dottedTheme,null,"\t"))
            classNameList.forEach(className => {
                if (theme[className])
                    resTheme[className] = theme[className];
                else {
                    var parts = parseClassName(className);
                    //console.log(parts);
                    partialClassName = "";
                    parts.forEach(part => {
                        if (dotProp.get(theme, partialClassName + part.name))
                            partialClassName += part.name;
                        else
                            partialClassName += "." + part.name;
                    });
                    //console.log(partialClassName);
                    if (dotProp.get(theme, partialClassName))
                        resTheme[className] = dotProp.get(theme, partialClassName);
                }
            });
            resolve(Object.keys(resTheme).length ? resTheme : null);
        });
    });
}

function parseClassName(className) {
    var regexpOfClassName = /([a-zA-Z\d]+)(-|_|\.){0,1}/g;
    var res = [],
        lastElement, secondLastElement,
        result = regexpOfClassName.exec(className);

    while (result) {
        lastElement = {
            name: result[1],
            delim: result[2]
        };
        res.push(lastElement);
        secondLastElement = res[res.length - 2];

        if (secondLastElement) {
            lastElement.name = (secondLastElement.delim !== "." ? "&" : "\\") +
                secondLastElement.delim + lastElement.name;
        }
        result = regexpOfClassName.exec(className);
    }
    res[0] && (res[0].name = className.charAt(0).replace(".", "\\.") + res[0].name);
    return res;
}



function getConfigTheme(settingsPath) {
    return new Promise((resolve, reject) => {
        fs.readFile(settingsPath, "utf-8", (err, data) => {
            var theme;
            if (err)
                return reject(err);
            try {
                theme = JSON.parse(data).config.theme;
            }
            catch (e) {
                return reject(e);
            }
            resolve(theme);
        });
    });
}
