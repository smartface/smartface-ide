module.exports = (components) => {
    var classNames = [];
    for (var i in components) {
        components[i].className &&
            (classNames = classNames.concat(components[i].className.split(/\s+/ig)));
    }
    var res = Array.from(new Set(classNames));
    //console.dir(res);
    return res;
};