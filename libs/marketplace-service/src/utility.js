function writeError(err, header) {
  console.error(prepareErrorMsg(err, header));
}

function prepareErrorMsg(err, header) {
  return "┌─── " + (err.err || header || "Unexpected Error") +
    (err.file ? "\n├─ file ─ " + err.file : "") +
    (err.msg ? "\n├─ " + err.msg : "") +
    (err.stack ? "\n├─ " + err.stack.toString("utf-8") : "") +
    (typeof err === "string" ? "\n├─ " + err : "");
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function toUniqueArrayBy(arr, prop) {
  var flag = {};
  return arr.reduce((acc, item) => {
    if (!flag[item[prop]]) {
      flag[item[prop]] = true;
      acc.push(item);
    }
    return acc;
  }, []);
}

function toUniqueArray(arr) {
  return Array.from(new Set(arr));
}

function writeMessage() {
  console.log.apply(null, arguments);
}

function getRandomName() {
  return `${getRandom()}_${getRandom()}_${getRandom()}`;
}

function getRandom() {
  return Math.floor(Math.random() * 1000);
}
module.exports = {
  writeError,
  escapeRegExp,
  capitalizeFirstLetter,
  toUniqueArrayBy,
  toUniqueArray,
  writeMessage,
  getRandomName,
  prepareErrorMsg
};
