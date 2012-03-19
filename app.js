// includes.
var EventEmitter = require('events').EventEmitter;

// MusicMe classes.
var Settings = require("./settings");
var Collection = require("./collection");
var Scanner = require("./scanner");
var Server = require("./server");

// create a global event object.
global.event = new EventEmitter();

// create a settings instance.
global.settings = new Settings(function(){

	// make a server.
	var server = new Server();

	// create the collection.
	var collection = new Collection(function(){
	
		// create a scanner.
		var scanner = new Scanner(function(){
		
			// initialise a scan.
			this.scan();
		
		});
	
	});
	
});