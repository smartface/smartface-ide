const INTERVAL = 10000; // 10 secs
const resetTimeoutIntervals = {};

export default {
  set: (deviceId: string, sendMessageFunction: Function) => {
    if (resetTimeoutIntervals[deviceId]) {
      clearInterval(resetTimeoutIntervals[deviceId]);
    }
    sendMessageFunction();
    resetTimeoutIntervals[deviceId] = setInterval(sendMessageFunction, INTERVAL);
  },
  clear: (deviceId: string) => {
    var interval = resetTimeoutIntervals[deviceId];
    if (interval) {
      clearInterval(interval);
      delete resetTimeoutIntervals[deviceId];
    }
  },
};
