var dot = require('dot-object');

module.exports = (components, dottedProps, prefix) => {
    var dottedObj = dot.dot(components);
    for(var prop in dottedProps){
        dottedObj[prop] = prefix + dottedProps[prop];
    }
}
