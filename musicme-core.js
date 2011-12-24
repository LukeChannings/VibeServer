// require dependencies.
var sqlite = require("sqlite3");
var fs = require("fs");
var crypto = require("crypto");

/**
 * MusicMe class
 * @description Connects to the database and reads the settings into itself.
 */
var MusicMe = function(callback){
	
	// remember who you are.
	var self = this;
	
	// open a database.
	var db = this.db = new sqlite.Database('musicme.db');
	
	// Turns the retrieved row into a member.
	function assignMember(err,row){
	
		// if the row was successfully fetched:
		if ( !err ) {
		
			// make the setting a member.
			self[row.id] = row.setting;
		
		}
		
		// if there was an error fetching the row, then throw it.
		else throw err;
		
	}
	
	// get settings, pass each row to assignMember and execute callback when finished.
	db.each('SELECT * FROM settings',assignMember,function(){
		
		// if there is no collection path, the database has probably just been created.
		if ( !self.collection_path ){
		
			self.createDatabaseSchema(function(){
			
				throw "MusicMe doesn't have a collection path set. Please set a path and re-run.";
			
			});
		}
		else {
		
			// check that the collection_path actually exists...
			fs.lstat(self.collection_path,function(err,stat){
			
				if ( !err && stat.isDirectory() )
				{
					callback.call(self);
				}
				else
				{
					throw "The current collection path is not a directory. Cannot continue.";
				}
			})
		}
		
		// check for an API port...
		if ( !self.api_port ){
		
			self.api_port = 3001; // default to port 3001.
		}
		
		// check for watch interval...
		if ( !self.watch_interval ){
		
			self.watch_interval = 30 * 60 * 1000; // default to 30 minutes.
		}
		
	});
	
}

/**
 * createDatabaseSchema
 * @description Creates a fresh musicme database.
 * @function callback - execute once the database has been created.
 * @WARNING - YOU MUST MANUALLY ADD collection_path TO settings AFTER THE SCHEMA HAS BEEN CREATED! 
 */
MusicMe.prototype.createDatabaseSchema = function(callback){

	var db = this.db;
	
	db.serialize(function(){

		// create settings.
		db.run("CREATE TABLE IF NOT EXISTS settings (id VARCHAR(100) PRIMARY KEY, setting VARCHAR(255))");
		
		// create albums.
		db.run("CREATE TABLE IF NOT EXISTS albums(hash VARHAR(255) PRIMARY KEY,album VARCHAR(255), artist VARCHAR(255), tracks INT(5), year INT(5), genre VARCHAR(255))");
		
		// create tracks.
		db.run("CREATE TABLE IF NOT EXISTS tracks(hash VARCHAR(255) PRIMARY KEY, title VARCHAR(255), album VARCHAR(255), trackno INT(5), path VARCHAR(255))",function(){
		
			// when the SQL statements have finished, execute the callback.
			callback();
		
		});
		
	});
	
}

/**
 * addTrackToCollection
 * @description Adds the current track to the database.
 * @object data - metadata.
 * @string path - path to the file.
 */
MusicMe.prototype.addTrackToCollection = function(data,callback){

	var db = this.db; // can't be doing with all these `this` prefixes everywhere! 
	
	// add album and track one after another.
	db.serialize(function(){
		
		// add the album to the collection.
		db.run("INSERT OR IGNORE INTO albums (hash,album,artist,tracks,year,genre) VALUES(?,?,?,?,?,?)", {
			1: crypto.createHash('md5').update(data.album + data.artist[0]).digest('hex'),
			2: data.album,
			3: data.artist[0],
			4: data.track.of,
			5: data.year,
			6: data.genre[0]
		});
		
		// add the track to the collection.
		db.run("INSERT OR REPLACE INTO tracks(hash,title,album,trackno,path) VALUES(?,?,?,?,?)",{
			1: crypto.createHash('md5').update(data.title+data.artist[0]+data.album).digest('hex'),
			2: data.title,
			3: data.album,
			4: data.track.no,
			5: data.path
		},
			callback // Once we're done, execute the callback.
		);
		
	});
}

/**
 * addGlobMetadataToCollection
 * @description Add a glob of metadata to the collection.
 * @array glob - Array of metadata objects.
 * @function end - function to be executed when objects have been added.
 */
MusicMe.prototype.addGlobMetadataToCollection = function(glob,end){

	var self = this;

	// addTrack function.
	(function addTrack(i){
	
		// if the last track is reached then call the end function. (if it exists.)
		if ( i === glob.length ){
			if ( typeof end === "function" ) end();
		}
		else{
			
			// otherwise, add the current track to the collection,
			self.addTrackToCollection(glob[i],function(){
			
				// and when that's finished, add the next track.
				addTrack(i + 1);
			});
			
		}
	
	})(0);

}

/**
 * updateCollectionChecksum
 * @description Update the database with a new checksum.
 */
MusicMe.prototype.updateCollectionChecksum = function(checksum){

	this.db.run("INSERT OR REPLACE INTO settings (id,setting) VALUES('collection_checksum',?)",{
		1:checksum
	});

}

/**
 * truncateCollection
 * @description Truncates the collection-related tables within the database.
 */
MusicMe.prototype.truncateCollection = function(callback){

	this.db.run("DELETE FROM tracks");
	this.db.run("DELETE FROM albums");
	
	if ( typeof callback === "function" ) callback();
	
}

// export myself.
module.exports = MusicMe;