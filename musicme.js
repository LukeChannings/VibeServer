// Include modules.
var Core = require("./musicme-core.js");
var Scanner = require("./musicme-scanner.js");

// make a core instance.
new Core(function control(){

	// be verbose.
	this.verbose = true;

	// make a scanner.
	var scanner = new Scanner(this.collection_path,this);

	// check if the collection data is up-to-date. (Scanning takes a while, why do it for no reason?)
	scanner.shouldIScan(function(iShouldScan){

		if ( iShouldScan ) scanner.scan();

		else console.log("Collection appears to be up-to-date.");

	});

});