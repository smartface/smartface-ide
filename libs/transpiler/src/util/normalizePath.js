module.exports = function normalizePath(path){
    console.log("path : ", path);
  return path.replace(/\\/g, '/');
}