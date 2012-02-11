var fs = require('fs');

function Settings(callback){

	var collectionPath;
	var collectionChecksum;
	var port;
	
	function writeSettings(){
	
		var settings = JSON.stringify({
		
			collection_path: collectionPath || '',
			collection_checksum : collectionChecksum || '',
			port : port || 3001
			
		},null,"\t");
	
		fs.writeFile('settings.json',settings,function(err){
			
			if ( err ) throw err;
			else console.log("settings.json has been updated.");
			
		});
	
	}
	
	(function loadSettings(){
	
		fs.readFile('settings.json',function(err,data){
		
			if ( err ) throw "No settings file.";
			else {
				
				var data = JSON.parse(data);
				
				collectionPath = data.collection_path || null;
				collectionChecksum = data.collection_checksum || null;
				port = data.port || 3000;
			
				if ( callback ) callback();
			}
		});
	})()
	
	this.get = function(key){
	
		switch (key) {
			case "collectionPath":
				return collectionPath;
				break;
			case "collectionChecksum":
				return collectionChecksum;
				break;
			case "port":
				return port;
				break;
			default:
				console.log("Unknown key.");
		}
	
	}
	
	this.set = function(key,value){
	
		switch (key) {
			case "collectionPath":
				collectionPath = value;
				break;
			case "collectionChecksum":
				collectionChecksum = value;
				break;
			case "port":
				port = value;
				break;
			default:
				console.log("Unknown key.");
		}
	
		// Commit the setting to file.
		writeSettings();
	
	}
}

module.exports = Settings;