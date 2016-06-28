var parser = {
	parse: function(sieFileData) {
		var root = new SieFile();
		var lines = sieFileData.split(/\r?\n/);
		var stack = [];
		var cur = root;
		for (var i in lines) {
			cur.poster = cur.poster || [];
			if (lines[i] == '{') {
				stack[stack.length] = cur;
				cur = cur.poster[cur.poster.length-1];
			} else if (lines[i] == '}') {
				cur = stack.pop();
			} else if (lines[i].match(/\s*#/)) {
				cur.poster[cur.poster.length] = parser._parseLine(lines[i].replace(/^\s*/,'').replace(/\s*$/,''));
			}
		}
		return root;
	},
	_parseLine: function(line) {
		var tokens = parser._tokenizer(line);
		var etikett = tokens[0].value.replace(/^#/,'').toLowerCase();
		var row = {
			etikett: etikett
		};
		return parser._parseAttrs(row, tokens.slice(1))
	},
	_Tokens: { ELEMENT: '#', BEGINARRAY: '{', ENDARRAY: '}', STRING: '"', ARRAY: "{}" },
	_tokenizer: function(line) {
		var tokens = []
		var consume = false;
		var quoted = false;
		for (var i=0; i<line.length; i++) {
			if (consume) {
				if (quoted) {
					if (line[i] == '\\' && (i+1)<line.length && line[i+1] == '"') {
						tokens[tokens.length-1].value += line[++i];
					} else {
						quoted = consume = (line[i] != '"');
						if (consume) {
							tokens[tokens.length-1].value += line[i];
						}
					}
				} else {
					consume = (line[i] != ' ' && line[i] != '\t' && line[i] != '}' );
					if (consume) {
						tokens[tokens.length-1].value += line[i];
					} else if (line[i] == '}') {
						tokens[tokens.length] = { type: parser._Tokens.ENDARRAY };
					}
				}
			} else {
				if (line[i] == '#') {
					consume = true;
					tokens[tokens.length] = { type: parser._Tokens.ELEMENT, value: '' };
				} else if (line[i] == '{') {
					tokens[tokens.length] = { type: parser._Tokens.BEGINARRAY };
				} else if (line[i] == '}') {
					tokens[tokens.length] = { type: parser._Tokens.ENDARRAY };
				} else if (line[i] == '"') {
					consume = quoted = true;
					tokens[tokens.length] = { type: parser._Tokens.STRING, value: '' };
				} else if (line[i] != ' ' && line[i] != '\t') {
					consume = true;
					tokens[tokens.length] = { type: parser._Tokens.STRING, value: line[i] };
				}
			}
		}
		return tokens;
	},
	_parseAttrs: function(row, tokens) {
		if (parser._Elements[row.etikett]) {
			for (var i=0; i<parser._Elements[row.etikett].length; i++) {
				if (typeof(parser._Elements[row.etikett][i]) == 'object') {
					parser._parseArray(tokens, i, parser._Elements[row.etikett][i]);
					parser._addAttr(row, parser._Elements[row.etikett][i].name, tokens, i);
				} else {
					parser._addAttr(row, parser._Elements[row.etikett][i], tokens, i);
				}
			}
		}
		return row;
	},
	_parseArray: function(tokens, start, attrDef) {
		for (var i=start+1; i < tokens.length; i++) {
			if (tokens[i].type == parser._Tokens.ENDARRAY) {
				tokens[start] = { type: parser._Tokens.ARRAY, value: parser._valuesOnly(tokens.splice(start, i-start).slice(1)) }
				var a = [];
				for (var j=0; j<(tokens[start].value.length-attrDef.type.length+1); j += attrDef.type.length) {
					var o = {};
					for (var k=0; k<attrDef.type.length; k++) {
						o[attrDef.type[k]] = tokens[start].value[j+k];
					}
					a[a.length] = o;
				}
				tokens[start].value = (attrDef.many ? a : a[0] || null);
			}
		}
	},
	_addAttr: function(obj, attr, tokens, pos)  {
		if (pos < tokens.length) {
			obj[attr] = tokens[pos].value;
		}
	},
	_valuesOnly: function(tokens) {
		var va = [];
		for (var i=0; i < tokens.length; i++) {
			va[va.length] = tokens[i].value;
		}
		return va;
	},
	_Elements: {
		"adress": [ 'kontakt', 'utdelningsadr', 'postadr', 'tel' ],
		"bkod": [ 'SNI-kod' ],
		"dim": [ 'dimensionsnr', 'namn' ],
		"enhet": [ 'kontonr', 'enhet' ],
		"flagga": [ 'x' ],
		"fnamn": [ 'företagsnamn' ],
		"fnr": [ 'företagsid' ],
		"format": [ 'PC8' ],
		"ftyp": [ 'Företagstyp' ],
		"gen": [ 'datum', 'sign' ],
		"ib": [ 'årsnr', 'konto', 'saldo', 'kvantitet' ],
		"konto": [ 'kontonr', 'kontonamn' ],
		"kptyp": [ 'typ' ],
		"ktyp": [ 'kontonr', 'kontotyp' ],
		"objekt": [ 'dimensionsnr', 'objektnr', 'objektnamn' ],
		"oib": [ 'årsnr', 'konto', { name: 'objekt', type: [ 'dimensionsnr', 'objektnr' ] }, 'saldo', 'kvantitet' ],
		"omfattn": [ 'datum' ],
		"orgnr": [ 'orgnr', 'förvnr', 'verknr' ],
		"oub": [ 'årsnr', 'konto', { name: 'objekt', type: [ 'dimensionsnr', 'objektnr' ] }, 'saldo', 'kvantitet' ],
		"pbudget": [ 'årsnr', 'period', 'konto', { name: 'objekt', type: [ 'dimensionsnr', 'objektnr' ] }, 'saldo', 'kvantitet' ],
		"program": [ 'programnamn', 'version' ],
		"prosa": [ 'text' ],
		"psaldo": [ 'årsnr', 'period', 'konto', { name: 'objekt', type: [ 'dimensionsnr', 'objektnr' ] }, 'saldo', 'kvantitet' ],
		"rar": [ 'årsnr', 'start', 'slut' ],
		"res": [ 'års', 'konto', 'saldo', 'kvantitet' ],
		"sietype": [ 'typnr' ],
		"sru": [ 'konto', 'SRU-kod' ],
		"taxar": [ 'år' ],
		"trans": [ 'kontonr', { name: 'objektlista', type: [ 'dimensionsnr', 'objektnr' ], many: true }, 'belopp', 'transdat', 'transtext', 'kvantitet', 'sign' ],
		"rtrans": [ 'kontonr', { name: 'objektlista', type: [ 'dimensionsnr', 'objektnr' ], many: true }, 'belopp', 'transdat', 'transtext', 'kvantitet', 'sign' ],
		"btrans": [ 'kontonr', { name: 'objektlista', type: [ 'dimensionsnr', 'objektnr' ], many: true }, 'belopp', 'transdat', 'transtext', 'kvantitet', 'sign' ],
		"ub": [ 'årsnr', 'konto', 'saldo', 'kvantitet' ],
		"underdim": [ 'dimensionsnr', 'namn', 'superdimension' ],
		"valuta": [ 'valutakod' ],
		"ver": [ 'serie', 'vernr', 'verdatum', 'vertext', 'regdatum', 'sign' ]
	},
	Universal: [
		{ etikett: 'dim', 'dimensionsnr': '1', 'namn': 'Kostnadsställe / resultatenhet'  },
		{ etikett: 'underdim', 'dimensionsnr': '2', 'namn': 'Kostnadsbärare', 'superdimension': '1' },
		{ etikett: 'dim', 'dimensionsnr': '6', 'namn': 'Projekt'  },
		{ etikett: 'dim', 'dimensionsnr': '7', 'namn': 'Anställd' },
		{ etikett: 'dim', 'dimensionsnr': '8', 'namn': 'Kund'  },
		{ etikett: 'dim', 'dimensionsnr': '9', 'namn': 'Leverantör' },
		{ etikett: 'dim', 'dimensionsnr': '10', 'namn': 'Faktura'  }
	],
	list: function(scan, etikett /* attribute name value pairs */) {
		var list = [];
		var fel = etikett.replace(/^#/,'').toLowerCase();
		for (var i in scan) {
			if (scan[i].etikett == fel) {
				var add = true;
				for (var j=2; j<arguments.length-1; j += 2) {
					add = (scan[i][arguments[j]] && scan[i][arguments[j]] == arguments[j+1]);
				}
				if (add) {
					list[list.length] = scan[i];
				}
			}
		}
		return list;
	}
};
function SieFile() {
	this.poster = [];
}
SieFile.prototype = {
	getKonto: function(kontonr) {
		var klist = this.list('konto', 'kontonr', kontonr);
		if (klist.length > 0) {
			var kptlist = this.list('kptyp');
			var ktlist = this.list('ktyp', 'kontonr', kontonr);
			var slist = this.list('sru', 'konto', kontonr);
			var elist = this.list('enhet', 'kontonr', kontonr);
			return {
				etikett: 'konto',
				'kontonr': klist[0]['kontonr'],
				'kontonamn': klist[0]['kontonamn'],
				'kontoplan': (kptlist.length > 0 ? kptlist[0]['typ'] : null),
				'kontotyp': (ktlist.length > 0 ? ktlist[0]['kontotyp'] : null),
				'SRU-kod': (slist.length > 0 ? slist[0]['SRU-kod'] : null),
				'enhet': (elist.length > 0 ? elist[0]['enhet'] : null)
			};
		}
	},
	getDimension: function(dimensionsnr) {
		var scan = this.poster.concat(parser.Universal);
		var list = parser.list(scan, 'underdim', 'dimensionsnr', dimensionsnr);
		if (list.length == 0) {
			list = parser.list(scan, 'dim', 'dimensionsnr', dimensionsnr);
		}
		if (list.length > 0) {
			return list[0];
		}
	},
	getObjekt: function(dimensionsnr, objektnr, separator) {
		var separator = separator || ' ';
		var olist = this.list('objekt', 'dimensionsnr', dimensionsnr, 'objektnr', objektnr);
		if (olist.length > 0) {
			var d = this.getDimension(dimensionsnr);
			var name = olist[0]['objektnamn'];
			if (d && d['superdimension']) {
				var polist = this.list('objekt', 'dimensionsnr', d['superdimension']);
				for (var i in polist) {
					if (olist[0]['objektnr'].indexOf(polist[i]['objektnr']) == 0) {
						name = this.getObjekt(polist[i]['dimensionsnr'], polist[i]['objektnr'], separator)['namn'] + separator + name;
						break;
					}
				}
			}
			return {
				etikett: 'objekt',
				'dimensionsnr': olist[0]['dimensionsnr'],
				'objektnr': olist[0]['objektnr'],
				'objektnamn': olist[0]['objektnamn'],
				'namn': name
			};
		}
	},
	list: function(etikett /* attribute name value pairs */) {
		var args = [];
		args[args.length] = this.poster;
		for (var i=0; i<arguments.length; i++) {
			args[args.length] = arguments[i];
		}
		return parser.list.apply(parser, args);
	}
};
module.exports = parser;
