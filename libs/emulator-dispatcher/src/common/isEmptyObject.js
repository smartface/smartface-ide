module.exports = function isEmptyObject(obj) {
    var isEmpty = true;
    if (obj && typeof obj === "object" && Object.keys(obj).length > 0) {
        isEmpty = false;
    }
    return isEmpty;
};
