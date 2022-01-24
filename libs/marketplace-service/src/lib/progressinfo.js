var bytes = require("bytes");

/**
 * handle process progress.
 * @class ProggressInfo
 * @param {object} options options of the progress bar.
 */
function ProggressInfo(total, title, writer) {
  this.total = total || 0; // bytes
  this.current = 0; // bytes
  this.receivedOneSec = 0; // bytes
  this.speed = 0; // byte KB MB .. not bit
  this.percent = 0;
  this.eta = 0;
  this.elapsedTime = 0;
  this.timer = null;
  this.title = title || "Downloading";
  this.writer = writer;
  this.onFinish = null;
}

ProggressInfo.prototype.update = function(len) {
  this.receivedOneSec += len;
};

ProggressInfo.prototype.finish = function() {
  this.receivedOneSec += this.total - this.current;
};
/**
 * start progress.
 * @method start
 * @memberof ProgressInfo
 * @return {boolean} succesfully starting now or has already started.
 */
ProggressInfo.prototype.start = function() {
  var res = false;
  var that = this;

  if (!this.timer) {
    res = true;
    this.timer = setInterval(function() {
      var receivedBytes = that.receivedOneSec;
      that.receivedOneSec = 0;
      that.elapsedTime += 1;
      that.current += receivedBytes;
      that.speed = bytes(that.current / that.elapsedTime, {
        unitSeparator: " "
      });
      that.percent = ((that.current * 100.0) / that.total).toFixed(0);
      that.eta = (that.total - that.current) / (that.current / that.elapsedTime).toFixed(2);
      if (that.writer) {
        that.writer(that.getInfo(true));
      }
      if (that.current >= that.total) {
        clearInterval(that.timer);
        that.timer = null;
        if (typeof that.onFinish === "function") {
          that.onFinish();
        }
      }
    }, 1000);
  }
  return res;
};

ProggressInfo.prototype.getInfo = function(isString) {
  var res;
  var spaceNum = 10;
  if (!isString) {
    res = {
      percent: this.percent,
      eta: this.eta,
      elapsedTime: this.elapsedTime,
      speed: this.speed
    };
  }
  else if (this.current >= this.total) {
    res = "\r" + this.title + ": " + rptSpace(this.percent, 3) +
      `${bytes(this.total, {unitSeparator: " "})} completed in` + beautyTime(this.elapsedTime) + " ".repeat(40) + "\r";
  }
  else {
    res = "\r" + this.title + ": " + rptSpace(this.percent, 3) + this.percent +
      "%    - " + rptSpace(this.speed) + this.speed + "/s    -  " +
      beautyTime(this.eta) + " ".repeat(spaceNum);
  }
  return res;

  function rptSpace(str, num) {
    var len = (num ? num : spaceNum) - str.toString('utf8').length;
    return " ".repeat(len > 0 ? len : 1);
  }
};

function beautyTime(secs) {
  secs = Math.round(secs - 1);
  var hours = Math.floor(secs / (60 * 60));

  var divisor_for_minutes = secs % (60 * 60);
  var minutes = Math.floor(divisor_for_minutes / 60);

  var divisor_for_seconds = divisor_for_minutes % 60;
  var seconds = Math.ceil(divisor_for_seconds);

  var res = "";
  if (secs > 0) {
    appendTimeStr(hours, "hour");
    appendTimeStr(minutes, "min");
    appendTimeStr(seconds, "sec");
  }
  else {
    res = " less than a second";
  }

  return res;

  function appendTimeStr(val, str) {
    if (val) {
      res += val + " " + str;
    }
    if (val > 1) {
      res += "s";
    }
    res += " ";
  }

}

ProggressInfo.beautyTime = beautyTime;

ProggressInfo.writer = function(data) {
  process.stdout.write(data);
};


ProggressInfo.prototype.isFinished = function() {
  return this.timer === null;
};
/*
function writer(data){
  process.stdout.write(data);
}
*/

module.exports = ProggressInfo;
