// Include modules.
var Core = require("./musicme-core.js");
var Scanner = require("./musicme-scanner.js");
var Server = require("./musicme-api.js");

// make a core.
new Core(function control(){

	// make a scanner.
	var scanner = new Scanner(this);

	// scan the collection.
	scanner.scan();
	
	// make an API.
	new Server(this,scanner);

});