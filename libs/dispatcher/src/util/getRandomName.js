function getRandomName(ext) {
  return `${getRandom()}_${getRandom()}_${getRandom()}${ext||""}`;
}

function getRandom() {
  return Math.floor(Math.random() * 1000);
}

module.exports = getRandomName;