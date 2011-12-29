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
	
	function assignMember(err,row){
		
		// if the row was successfully fetched:
		if ( !err ) {
			
			// make the setting a member.
			self[row.id] = row.setting;
			
		}
			
		// if there was an error fetching the row, then throw it.
		else throw err;
	
	};
	
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
			
				if ( err && ! stat.isDirectory() )
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
		
			self.watch_interval = 1 * 60 * 1000; // default to 30 minutes.
		}
		
		// make an object to put stats in.
		var status = self.status = {};
		
		// get some collection statistics.
		db.serialize(function(){
		
			// find the number of tracks.
			db.get('SELECT count(*) FROM tracks',function(err,row){
				
				status.trackCount = row["count(*)"];
				
			});
			
			// find the number of albums.
			db.get('SELECT count(*) FROM albums',function(err,row){
				
				status.albumCount = row["count(*)"];
				
			});
		
			// find the number of artists.
			db.get('SELECT count(DISTINCT artist) FROM albums',function(err,row){
			
				status.artistCount = row["count(DISTINCT artist)"];
			
			});
			
			// find the number of genres.
			db.get('SELECT count(DISTINCT genre) FROM albums',function(err,row){
				
				status.genreCount = row["count(DISTINCT genre)"];
				
			},function(){
			
				//run the callback.
				callback.call(self);
			
			})
		
		});
		
	});
	
}

/**
 * createDatabaseSchema
 * @description Creates a fresh musicme database.
 * @function callback - execute once the database has been created.
 * @WARNING - YOU MUST MANUALLY ADD collection_path TO settings AFTER THE SCHEMA HAS BEEN CREATED! 
 */
var createDatabaseSchema = MusicMe.prototype.createDatabaseSchema = function(callback){

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
 * updateCollectionChecksum
 * @description Update the database with a new checksum.
 */
var updateCollectionChecksum = MusicMe.prototype.updateCollectionChecksum = function(checksum){

	this.db.run("INSERT OR REPLACE INTO settings (id,setting) VALUES('collection_checksum',?)",{
		1:checksum
	});

	this.collection_checksum = checksum;

}

/**
 * truncateCollection
 * @description Truncates the collection-related tables within the database.
 */
var truncateCollection = MusicMe.prototype.truncateCollection = function(callback){

	this.db.run("DELETE FROM tracks");
	this.db.run("DELETE FROM albums");
	
	if ( typeof callback === "function" ) callback();
	
}

// export myself.
module.exports = MusicMe;