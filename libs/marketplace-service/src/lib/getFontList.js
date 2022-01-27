const path = require("path");

const dot = require('dot-object');

const fontFamilyRegexp = /\.font\.family/ig;

module.exports = (fontsFolder, components, __bundleTheme) => {
    var fonts = [];
    const dottedObj = Object.assign(dot.dot(__bundleTheme), dot.dot(components));
    for (var prop in dottedObj) {
        fontFamilyRegexp.lastIndex = 0;
        fontFamilyRegexp.test(prop) && prop !== "Default" && fonts.push(dottedObj[prop]);
    }
    //console.dir(fonts)
    return Array.from(new Set(fonts)).map(font => {
        return {
            src: path.join(fontsFolder, font),
            relPath: "",
            isDir: true,
            name: font
        };
    });
};
