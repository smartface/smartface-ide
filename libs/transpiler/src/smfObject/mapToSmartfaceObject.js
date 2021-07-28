const dotProp = require('dot-prop');

module.exports = function(mapJSON) {
    var _mapJSON;
    if (mapJSON) {
        _mapJSON = mapJSON;
    }
    else {
        _mapJSON = require("../../defaultMap.json");
    }

    this.get = function(key) {
        return dotProp.get(_mapJSON, key);
    };
};
