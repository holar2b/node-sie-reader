var cp437 = require('./cp437.js');
var parser = require('./parser.js');
var sie = {
	readBuffer: function(original_data) {
		return parser.parse(cp437.convert(original_data).toString());
	}
};
module.exports = sie;
