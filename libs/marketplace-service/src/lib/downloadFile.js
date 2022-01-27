var https = require('https');
var fs = require('fs');
var path = require('path');

const ProgressInfo = require('./progressinfo');

module.exports = (url, dest, maxLen, cb, _filename) => {
	var file = fs.createWriteStream(dest);
	https.get(url, function(response) {
		var contentLength = response.headers["content-length"];
		response.pipe(file);
		file.on('finish', function() {
			file.close(function(err) {
				if (err) {
					cb(err);
				}
				else if (!contentLength) {
					cb(null);
				}
			});
		});

		if (contentLength) {
			var fname = _filename || path.basename(dest);
			var spaceLength = (maxLen + 2) - fname.length;
			var proginfo = new ProgressInfo(Number(contentLength),
				"Downloading " + fname + " ".repeat((spaceLength> 0) ? spaceLength : 2 ) +": ",
				ProgressInfo.writer);
			proginfo.start();
			proginfo.onFinish = cb;
			response.on("data", function(chunk) {
				proginfo.update(chunk.length);
			});
		}

	}).on('error', function(err) {
		fs.unlink(dest);
		if (cb) {
			cb(err);
		}
	});
}