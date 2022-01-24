const path = require("path");

const recursiveReaddir = require("recursive-readdir");
const dot = require('dot-object');

const escapeRegExp = require("../utility.js").escapeRegExp;
const toUniqueArray = require("../utility.js").toUniqueArray;

const pngRegexp = /\.png/ig;

module.exports = (imagesFolder, components, prefix, bundleTheme) => {
    return new Promise((resolve, reject) => {
        var res = [];
        var androidImageFolder = path.join(imagesFolder, "Android");
        recursiveReaddir(androidImageFolder, (err, files) => {
            if (err) {
                err.file = androidImageFolder;
                return reject(err);
            }
            var imagesProps = getImagesFromData(components);
            var themeImages = getImagesFromData(bundleTheme || {});
            var images = toUniqueArray(imagesProps.images.concat(themeImages.images));
            if (images.length === 0)
                return resolve({
                    assets: [],
                    props: {}
                });
            /*
            var invalidImageNames = getInvalidImageNames(images, prefix);
            if (invalidImageNames.length)
                return reject(new Error("Invalid image name/s > " +
                invalidImageNames.join(", ") + "\n\t image name must start with name of package ("+
                prefix + "), example:> " + prefix + "smartface.png"));
            */
            var iOSimageSet = images.map(img => img.replace(".png", ""));
            files.forEach(file => {
                if (images.indexOf(path.basename(file)) !== -1) {
                    res.push({
                        src: file,
                        relPath: path.relative(imagesFolder, file),
                        name: path.basename(file).replace(".png", ""),
                        isRelPathFull: true
                    });
                    //console.log("ANDROID: ", file);
                }
            });
            //console.dir(iOSimageSet);
            iOSimageSet.forEach(oneSet => res.push({
                isDir: true,
                src: path.join(imagesFolder, "iOS", oneSet + ".imageset"),
                relPath: path.join("iOS", oneSet + ".imageset"),
                name: oneSet
            }));
            resolve({
                assets: res,
                props: imagesProps.props
            });
        });
    });
};

function getImagesFromData(data) {
    var images = [];
    var props = {};
    const dottedObj = dot.dot(data);
    for (var prop in dottedObj) {
        pngRegexp.lastIndex = 0;
        if (pngRegexp.test(dottedObj[prop])) {
            images.push(dottedObj[prop]);
            props[prop] = dottedObj[prop];
        }
    }
    return {
        images: Array.from(new Set(images)),
        props
    };
}

function getInvalidImageNames(images, prefix) {
    var res = [];
    for (var img in images) {
        if (!images[img].startsWith(prefix))
            res.push(images[img]);
    }
    return res;
}
