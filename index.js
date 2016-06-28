var fs = require('fs');
var cp437 = require('./cp437.js');
var parser = require('./parser.js');
var sie = {
	readFile: function(fileName, callback) {
		fs.readFile(fileName, function(err, original_data){
			if (!err) {
				try {
					callback(null, sie.readBuffer(original_data));
				} catch(ex) {
					callback(ex);
				}
			} else {
				callback(err);
			}
		});
	},
	readBuffer: function(original_data) {
		return parser.parse(cp437.convert(original_data).toString());
	}
};
module.exports = sie;
