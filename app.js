// includes.
var EventEmitter = require('events').EventEmitter;

// MusicMe classes.
var Settings = require("./settings.js");
var Collection = require("./collection.js");
var Scanner = require("./scanner.js");

// create a global event object.
global.event = new EventEmitter();

// create a settings instance.
global.settings = new Settings(function(){

	// create the collection.
	var collection = new Collection(function(){
	
		// create a scanner.
		var scanner = new Scanner(function(){
		
			this.scan();
		
		});
	
	});
	
});