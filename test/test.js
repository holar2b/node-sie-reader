var assert = require('assert');
var sie = require('../');

assert.ok(sie, 'Failed to require SIE');

sie.readFile('./test/test.SI', function(err, data){
	assert.ifError(err);	
	
	var fnamn = data.list('fnamn');
	assert.ok(fnamn.length == 1, '1.1 Failed to read object');
	assert.ok(fnamn[0]['företagsnamn'] == 'Testföretaget', '1.2 Failed to convert charset to UTF8');
	
	var ver = data.list('ver');
	assert.ok(data.list('ver').length == 2, '2.1 Failed to list verifications');	
	assert.ok(ver[0].vernr == '1', '2.2 Failed to read verification attributes');	
	assert.ok(ver[0].poster.length == 6, '2.3 Failed to list verification transactions');	
	assert.ok(ver[0].poster[2].belopp == '11025.00', '2.4 Failed to read transaction attributes');
	
	var k = data.getKonto(ver[0].poster[2].kontonr);
	assert.ok(k.kontonamn == 'Bank, checkräkningskonto', '3.1 Utility getKonto failed to read attributes');
	assert.ok(k.kontoplan == 'EUBAS97', '3.2 Utility getKonto failed to lookup kontoplan');
	
	var o = data.getObjekt(ver[0].poster[2].objektlista[0].dimensionsnr, ver[0].poster[2].objektlista[0].objektnr);
	assert.ok(o.objektnamn == 'Utbildning', '4.1 Utility getObjekt failed to lookup objekt');
	assert.ok(o.namn = 'Konsult Utbildning', '4.1 Utility getObjekt failed to traverse dimensions');
});