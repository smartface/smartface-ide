export default function getRandomName(ext?: string) {
  return `${getRandom()}_${getRandom()}_${getRandom()}${ext||""}`;
}

export function getRandom() {
  return Math.floor(Math.random() * 1000);
}

