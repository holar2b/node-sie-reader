var cp437 = { 
	mapUTF8: 'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ',
	convert: function(buffer) {
		var bb = [];
		for (var i=0; i<buffer.length; i++) {
			bb[bb.length] = new Buffer(buffer[i] < 128 ? [ buffer[i] ] : cp437.mapUTF8.substr(buffer[i]-128,1));
		}
		return Buffer.concat(bb);
	}
};
module.exports = cp437;