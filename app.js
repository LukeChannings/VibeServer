// Include modules.
var Core = require("./musicme-core.js");
var Scanner = require("./musicme-scanner.js");
var Server = require("./musicme-api.js");

// make a core.
new Core(function control(){

	// be verbose.
	this.verbose = true;

	// make a scanner.
	var scanner = new Scanner(this.collection_path,this);

	var self = this;

	// check if the collection data is up-to-date. (scanning takes a while, why do it for no reason?)
	(function watchCollection(){
	
		scanner.shouldIScan(function(iShouldScan){

			if ( iShouldScan ){
				
				scanner.scan(function(){
				
					console.log("Scanning finished.");
				
					// run the test again after the interval.
					//setTimeout(watchCollection,self.watch_interval);
				
				});
				
			}
			else{
			
				console.log("Collection checked " + new Date());
			
				// run the test again after the interval.
				//setTimeout(watchCollection,self.watch_interval);
				
			}
		
		});
	
	})();

	// make an API.
	new Server(this,scanner);

});