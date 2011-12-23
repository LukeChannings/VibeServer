// Include core.
var core = require("./musicme-core.js");
var Scanner = require("./musicme-scanner.js");

// make a core instance.
new core(function control(){
	
	var scanner = new Scanner(this.collection_path,this);
	
	scanner.shouldIScan(function(iShouldScan){
	
		if ( iShouldScan ) scanner.scan();

		else console.log("Collection appears to be up-to-date.");
		
	});
	
});