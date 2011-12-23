// require dependencies.
var sqlite = require("sqlite3");
var fs = require("fs");

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
		if ( !self.collection_path )
		{
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
		db.run("CREATE TABLE IF NOT EXISTS settings (id VARCHAR(100), setting VARCHAR(255))");
		
		// create albums.
		db.run("CREATE TABLE IF NOT EXISTS albums(album VARCHAR(255) PRIMARY KEY, album_artist VARCHAR(255), tracks INT(100), year INT(6), genre VARCHAR(255), art VARCHAR(255))");
		
		// create tracks.
		db.run("CREATE TABLE IF NOT EXISTS tracks(title VARCHAR(255), artist VARCHAR(255), trackno INT(2), path VARCHAR(255))",function(){
		
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
MusicMe.prototype.addTrackToCollection = function(data,path){

	var db = this.db; // can't be doing with all these `this` prefixes everywhere! 
	
	// add the album to the collection.
	db.run("INSERT OR IGNORE INTO albums (album, album_artist, tracks, year, genre) VALUES(?,?,?,?,?)", {
		1: data.album[0],
		2: ( !data.albumartist || data.albumartist.length == 0 ) ? data.artist[0] : data.albumartist[0],
		3: data.track.of,
		4: data.year,
		5: data.genre
	});
	
	// add the track to the collection.
	db.run("INSERT INTO tracks (title, artist, trackno, path) VALUES(?,?,?,?)",{
		1: data.title,
		2: data.artist[0],
		3: data.track.of,
		4: path
	});

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