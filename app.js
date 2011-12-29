// Include modules.
var Core = require("./musicme-core.js");
var Scanner = require("./musicme-scanner.js");
var Server = require("./musicme-api.js");

// make a core.
new Core(function control(){

	// make a scanner.
	var scanner = new Scanner(this.collection_path,this);

	var self = this;

	// scan the collection.
	scanner.scan(function(){
		
		setTimeout(watch,self.watch_interval);
		
	});
	
	// make an API.
	new Server(this,scanner);

});