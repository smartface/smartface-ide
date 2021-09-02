const INTERVAL = 10000; // 10 secs

module.exports = {
    set: function(deviceId, sendMessageFunction) {
        if (global.shared.resetTimeoutIntervals[deviceId]) {
            clearInterval(global.shared.resetTimeoutIntervals[deviceId]);
        }
        sendMessageFunction();
        global.shared.resetTimeoutIntervals[deviceId] = setInterval(sendMessageFunction, INTERVAL);
    },
    clear: function(deviceId) {
        var interval = global.shared.resetTimeoutIntervals[deviceId];
        interval && clearInterval(interval);
    }
};
