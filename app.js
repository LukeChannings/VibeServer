// dependencies.
var http = require('http');
var io = require('socket.io');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');

// app.
var core = require('./core.js');
var Scanner = require('./scanner.js');
var API = require('./api.js');

// globals.
global.emitter = new EventEmitter();
global.sqlite = require('sqlite3');
global.scanning = false;

emitter.on('loadSettings',function(callback){

	fs.readFile('./settings.json',function(err,data){
	
		if ( err ) throw "No Settings file. Create settings.json with collection_path and port as minimum settings.";
		else{
		
			global.settings = JSON.parse(data);
		
			// run the callback.
			callback();
		
		}
	
	});

});

emitter.on('saveSettings',function(){

	fs.open('./settings.json','w',function(err,fd){
	
		if ( err ) throw err;
		
		else{
		
			fs.write(fd,JSON.stringify(settings,false,"\t"));
		
			fs.close(fd);
		
		}
		
	});

});

// load settings.
emitter.emit('loadSettings',function(){

	// make the app core.
	new core(function(){
	
		// declare globals.
		global.app = http.createServer().listen(settings.port);
		global.io = io.listen(app);
		global.db = this.db;
		
		// instantiate the API and Scanner.
		var api = new API();
		var scanner = new Scanner();
	
	});

});