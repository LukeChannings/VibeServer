// Require dependencies.
var sqlite = require("sqlite3");

/**
 * MusicMe class
 * @description Connects to the database and reads the settings into itself.
 */
var MusicMe = function(callback){
	
	// Remember who you are.
	var self = this;
	
	// Open a database.
	var db = this.db = new sqlite.Database('musicme.db',function(){
	
		// stops the database from not shrinking.
		db.run("PRAGMA auto_vacuum = full");
	
	});
	
	// Turns the retrieved row into a member.
	function assignMember(err,row){
	
		// If the row was successfully fetched:
		if ( !err ) {
		
			// Make the setting a member.
			self[row.id] = row.setting;
		
		}
		
		// If there was an error fetching the row, then throw it.
		else throw err;
		
	}
	
	// Get settings, pass each row to assignMember and execute callback when finished.
	db.each('SELECT * FROM settings',assignMember,function(){
		
		// if there is no collection path, the database has probably just been created.
		if ( !self.collection_path )
		{
			self.createDatabaseSchema(function(){
			
				throw "MusicMe doesn't have a collection path set. Please set a path and re-run.";
			
			});
			
		}
		else {
			callback.call(self);
		}
	});
	
}

/**
 * MusicMe::createDatabaseSchema
 * @description Creates a fresh musicme database.
 * @function callback - execute once the database has been created.
 * @WARNING - YOU MUST MANUALLY ADD collection_path TO settings AFTER THE SCHEMA HAS BEEN CREATED! 
 */
MusicMe.prototype.createDatabaseSchema = function(callback){

	var db = this.db;
	
	db.serialize(function(){

		// Create settings.
		db.run("CREATE TABLE IF NOT EXISTS settings (id VARCHAR(100), setting VARCHAR(255))");
		
		// Create albums.
		db.run("CREATE TABLE IF NOT EXISTS albums(album VARCHAR(255) PRIMARY KEY, album_artist VARCHAR(255), tracks INT(100), year INT(6), genre VARCHAR(255), art VARCHAR(255))");
		
		// Create tracks.
		db.run("CREATE TABLE IF NOT EXISTS tracks(title VARCHAR(255), artist VARCHAR(255), album VARCHAR(255), trackno INT(2), path VARCHAR(255))",function(){
		
			// When the SQL statements have finished, execute the callback.
			callback();
		
		});
		
	});
	
}

/**
 * addTrackToCollection ( RUN WITH .apply(this, [data,path])! )
 * @description Adds the current track to the database.
 * @object data - metadata.
 * @string path - path to the file.
 */
MusicMe.prototype.addTrackToCollection = function(data,path){

	var db = this.db; // can't be doing with all these `this` prefixes everywhere! 
	
	// add the album to the collection.
	db.run("INSERT OR IGNORE INTO albums (album, album_artist, tracks, year, genre) VALUES(?,?,?,?,?)", {
		1: data.album,
		2: ( !data.albumartist || data.albumartist.length == 0 ) ? data.artist : data.albumartis,
		3: data.track.of,
		4: data.year,
		5: data.genre
	});
	
	// add the track to the collection.
	db.run("INSERT INTO tracks (title, artist, album, trackno,path) VALUES(?,?,?,?,?)",{
		1: data.title,
		2: data.artist,
		3: data.album,
		4: data.track.of,
		5: path
	});
}

/**
 * updateCollectionChecksum
 * @description Update the database with a new checksum.
 */
MusicMe.prototype.updateCollectionChecksum = function(checksum){

	this.db.run("INSERT OR REPACE INTO settings (id,setting) VALUES('collection_checksum',?)",{
		1:checksum
	});

}

// export myself.
module.exports = MusicMe;