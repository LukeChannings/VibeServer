// get the filesystem module.
var fs = require('fs');

function Settings(callback){

	// settings object.
	var settings = {};

	/**
	 * readSettings
	 * @description reads the contents of settings.json into the settings object.
	 */
	(function readSettings(){
	
		// read the settings file.
		fs.readFile("settings.json",function(err,data){
		
			// throw an error if the settings file does not exist.
			if ( err ) console.error("Settings file does not exist.");
		
			else {
				
				// parse the JSON file and put the resulting object into settings.
				settings = JSON.parse(data);
				
				// run the callback when the settings file is loaded.
				callback();
				
			}
		
		});
	
	})();
	
	/**
	 * writeSettings
	 * @description write the settings object back into settings.json.
	 */
	function writeSettings(){
	
		// convert the object into a string.
		var data = JSON.stringify(settings,null,"\t");
	
		// write the stringified object to settings.json.
		fs.writeFile("settings.json",data,function(err){
		
			// if there is an error, then log it.
			if ( err ) console.error(err);
			
			// log that the settings have been updated.
			else console.log("Settings updated.");
		
		});
	
	}

	/**
	 * set
	 * @description set a setting.
	 * @param key (string) - the setting key.
	 * @param value (string) - the value for the setting.
	 */
	this.set = function(key,value){
	
		// set a setting.
		settings[key] = value;
	
		// commit the setting.
		writeSettings();
	
	}
	
	/**
	 * unset
	 * @description Delete a setting.
	 * @param key (string) - the key to unset.
	 */
	this.unset = function(key){
	
		// make sure there is a key.
		if ( settings[key] )
		{
			// delete the key.
			delete settings[key];
		
			// write the change to settings.json.
			writeSettings();
		}
		else
		{
			// if there is no key then log it.
			console.error("Unable to unset '" + key + "' as it does not exist.");
		}
	}
	
	/**
	 * get
	 * @description Get a setting.
	 * @param key (string) - the name of the setting.
	 */
	this.get = function(key){
	
		// return the value.
		return settings[key];
	
	}

}

module.exports = Settings;