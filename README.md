*This documentation is in swedish since [SIE](http://www.sie.se/sie/home/showpage.php?page=english) is a local standard for transferring accounting information.* 

# sie-reader - en node.js läsare för SIE-filer
Använd läsaren för att läsa in en SIE-fil till ett javascriptobjekt. Vid inläsning konverteras teckensnittet från IBM PC 8-bitars extended ASCII (Codepage 437) till UTF8. Det inlästa objektet kan i sin tur t.ex. användas för att processa datat, konvertera datat till annat format eller för att implementera en webbtjänst. 

Mer information om SIE hittar du på [SIE-gruppens hemsida](http://www.sie.se).

## Innehåll

- [Installation](#i)
- [Modulobjekt](#l)
  - [readFile(sökväg, callback)](#l1)
  - [readBuffer(buffert)](#l2)
- [Klass: SieFile](#o)
  - [Lista av poster](#o1)
  - [list(etikett)](#o2)
  - [getKonto(kontonr)](#o3)
  - [getObjekt(dimensionsnr, objektnr)](#o4)
- [Exempel](#e)
- [Licensvillkor](#lic)

<a name="i"></a>
## Installation
via npm:

```bash
$ npm install sie-reader
```

<a name="l"></a>
## Modulobjekt
Du kan antingen läsa in en fil eller en buffert med SIE-data. Använd buffertfunktionen när datat skickats till din applikation, t.ex. genom http-uppladdning.

För att kunna använda läsaren måste du lägga till modulen i din lösning:

```js
var sie = require('sie-reader');
```

<a name="l1"></a>
### readFile(sökväg, callback)
Metoden läser in en SIE-fil (asynkront) och anropar en av dig tillhandahållen callback-funktion när den är klar. 

Din callback behöver ta två argument <code>err</code> och <code>data</code>. Om inget fel inträffat innehåller data-argumentet ett [SieFile-objekt](#o).

```js
sie.readFile('minFil.SIE', function(err, data){
	if (err) throw err;
	// Använd data
});
```

<a name="l2"></a>
### readBuffer(buffer)
Metoden läser en buffert innehållande SIE-data och omvandlar detta till ett javascriptobjekt av klassen SieFile. 

Argumentet <code>original_data</code> måste vara en instans av klassen <code>Buffer</code>, se [dokumentationen för node.js](http://nodejs.org/api/buffer.html)

```js
var sieFile = sie.readBuffer(original_data);
```

<a name="o"></a>
## Klass: SieFile
När en SIE-datat är inläst m.h.a modulobjektets funktioner har du en <code>SieFile</code> innehållande en objektstruktur med SIE-poster. 

<code>SieFile</code>-objektet erbjuder dessutom ett antal hjälpmetoder för vanligt förekommande, eller besvärliga, uppgifter.

<a name="o1"></a>
### Lista av poster
<code>SieFile</code> har en lista med objekt, <code>poster</code>, motsvarande posterna i SIE-filen. Underposter återfinns inte i listan utan lagras i en lista i den post de hör till.

Objekten listan motsvarar de objekt som finns i SIE-formatet och objektens attribut har samma namn som motsvarande postargument i SIE, t.ex. innehåller kontoobjektet attributen <code>kontonr</code> och <code>kontonamn</code>. 

För att avgöra vilken typ av post ett objekt motsvarar finns ett alltid extra attribut, <code>etikett</code>. Attributet innehåller postens etikett i gemener och exklusive det inledande #-tecknet. Ett exempel på ett kontoobjekt:

```js
{ "etikett": "KONTO", "kontonr": "1790", "kontonamn": "Övr interimsfordringar" }
```

Om objektet har underobjekt finns finns dessutom ett <code>poster</code>-attribut innehållande underobjekten. Således har objekt med <code>etikett == "ver"</code> en lista med transaktionsposter.

<a name="o2"></a>
### list(etikett)
Metoden <code>list</code> kan användas för att filtrera listan av poster. Endast poster med den angivna etiketten returneras. 

Följande exempel ger en lista innehållande samtliga verifikat:

```js
var verifikat = sieFile.list("ver");
```

Du kan dessutom ange ytterligare argument, utöver <code>etikett</code>, i form av namn/värde-par för att filterera på posternas attribut. 

Följande exempel ger en lista innehållande verifikaten i serie A:

```js
var verifikat = sieFile.list("ver", "serie", "A");
```

<a name="o3"></a>
### getKonto(kontonr)
Metoden <code>getKonto</code> är en ren bevämlighetsfunktion som returnerar ett enda objekt, d.v.s. inte en lista med ett element. Dessutom slår den upp ytterligare information för kontot som kontotyp och SRU-kod och lägger till denna som attribut i det returnerade objektet.

Följande visar hur kontots namn kan slås upp om kontonumret är känt:

```js
var kontonamn = sieFile.getKonto("1790").kontonamn;
```

<a name="o4"></a>
### getObjekt(dimensionsnr, objektnr)
Metoden <code>getObjekt</code> hjälper dig att slå upp ett föräldraobjekt m.h.a. SIE-filens dimensionsangivelser.

Metoden returnerar ett objekt som, utöver de attribut som hör till poster av typen #OBJEKT, inkluderar extra attributen <code>namn</code>, innehållande det sammansatta (konkaternerade) namnet, och <code>parent</code> som är en pekare till föräldraobjektet.

Konkateneringen sker genom att lägga till föräldernsnamn framför objektets eget namn med ett separatortecken mellan. Standardseparatorn är ett blanksteg. Du kan ändra separator genom att ange ett tredje argument till metoden.

Om SIE-filen innehåller nedanstående data så är <code>sieFile.getObjekt("21, "0102") == "Barnavd Barn 1-3 år"</code>.

```
 #DIM 20 "Avdelning"
 #UNDERDIM 21 "Underavdelning" 20
 #OBJEKT 20 "01" "Barnavd"
 #OBJEKT 20 "02" "Ungdomsavd"
 #OBJEKT 21 "0101" "Spädbarn"
 #OBJEKT 21 "0102" "Barn 1-3 år"
 o.s.v.
```

<a name="e"></a>
## Exempel
Följande exempel implementerar en komplett webbtjänst som läser in en SIE-fil (t.ex. FAKT.SI) och returnerar dess verifikat som JSON-objekt. Dessutom används SIE-objektets metoder för att slå upp kontobeskrivningar i kontoplanen och eventuella objekt ur objektsregistret.

```js
var express = require('express');
var sie = require('sie-reader');
var sieFileName = './FAKT.SI';
var app = express();
app.use(express.bodyParser());
app.all('*', function(req, res, next){
	sie.readFile(sieFileName, function(err, sieFile){
		if (err) next(err);
		else {
			sieFile.list('ver').forEach(function(v) { 
				v.poster.forEach(function(t) {
					t.kontonamn = sieFile.getKonto(t.kontonr).kontonamn;
					if (t.objektlista) t.objektlista.forEach(function(o) {
						var od = sieFile.getObjekt(o.dimensionsnr, o.objektnr);	
						o.objektnamn = od.objektnamn;
						o.namn = od.namn;
					});
				});
			});		
			res.json(sieFile.list('ver'));
		}
	});	
});
app.listen(3000, '127.0.0.1');
```

Exemplet använder [Express](http://expressjs.com/) som webbramverk.

<a name="lic"></a>
## Licensvillkor - MIT licens
Copyright (C) 2012 R2B Software [http://www.r2bsoftware.com](http://www.r2bsoftware.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

