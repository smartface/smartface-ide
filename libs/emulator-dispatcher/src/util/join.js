const path = require('path');

module.exports = function join(){
  let args = Array.prototype.slice.call(arguments);
  
  return path.join.apply(null, args).replace(/\\/g, "/");
}