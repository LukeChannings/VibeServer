// Dependencies.
var sqlite = this.sqlite = require('sqlite3');
var musicmetadata = require("musicmetadata");
var fs = require("fs");
var walk = require('walk');
var crypto = require("crypto");

// Constructor.
var MusicMe = function(callback){
	
	// Remember who you are.
	var self = this;
	
	// Open a database.
	var db = this.db = new sqlite.Database('musicme.db');
	
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
	
		// Execute the callback, make it remember who it is!
		callback.call(self);
	
	});

}

/**
 * createDatabaseSchema
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
 * walkCollection
 * @description Walks the collection_path and looks for audio files.
 * @variable callback - function to be executed on completion, will be passed the array.
 */
MusicMe.prototype.walkCollection = function(callback){
	
	// Make sure there is a path.
	if ( !this.collection_path ){
		
		this.collection_path = "/Volumes/Media/Music";
		
		// If there's no collection path then the database has probably just been created.
		this.createDatabaseSchema(function(){
		
			throw 'There is no collection path. Fail.';
		
		});
		
	}
	
	// Remember who you are.
	var self = this;
	
	// Make a walker.
	var walker = walk.walk(this.collection_path);
	
	// Array for song paths.
	var songs = [];
	
	// Check each file.
	walker.on('file',function checkFile(path,stat,next){
		
		// Check for an audio file.
		if ( /\.(mp(3|4)|aac|wav|flac|ogg)$/.test(stat.name) ){
			
			// Push the song path to the song array.
			songs.push(path.replace(self.collection_path,'') + '/' + stat.name);
		
		}
		
		// Read next file.
		next();
		
	});
	
	// When the walking has finished:
	walker.on('end',function EOF(){
		
		// Execute the callback and pass it the songs array.
		callback(songs);
		
	});
	
}

/**
 * getMetadata
 * @description Gets the metadata for an audio file.
 * @variable paths - array of paths to get the metadata for.
 * @variable callback - function to execute when finished, passed an array of metadata objects.
 */
MusicMe.prototype.getMetadata = function(path, callback, next){
	
	var parser = new musicmetadata(fs.createReadStream(path));
	
	parser.on('metadata',function(metadata){
		
		callback(metadata);
		
	});
	
	parser.on('done',function(err){
		
		if ( err ) console.log(err);
		
		parser = null;
		
		next();
		
	});

}

/**
 * addTrackToCollection
 * @description Adds the current track to the database.
 */
MusicMe.prototype.addTrackToCollection = function(data,path){
	
	var albumartist = ( !data.albumartist || data.albumartist.length == 0 ) ? data.artist : data.albumartist;
	
	var db = this.db;
	
	db.serialize(function(){
		
		// Add the album to the collection.
		db.run("INSERT OR IGNORE INTO albums (album, album_artist, tracks, year, genre) VALUES(?,?,?,?,?)", {
			
			1: data.album,
			2: albumartist,
			3: data.track.of,
			4: data.year,
			5: data.genre
			
		});
		
		// Add the track to the collection.
		db.run("INSERT INTO tracks (title, artist, album, trackno,path) VALUES(?,?,?,?,?)",{
			1: data.title,
			2: data.artist,
			3: data.album,
			4: data.track.of,
			5: path
		});
	
	});
}

// MusicMe instance controller.
new MusicMe(function controller(){
	
	// Can't have anyone telling us we're someone else.
	var self = this;
	
	// Walk the collection and build a list of audio files.
	self.walkCollection(function finishedWalking(paths){
		
		// Generate checksum.
		var checksum = crypto.createHash('md5').update(paths.join('')).digest('hex');
		
		if ( self.collection_checksum == checksum )
		{
			console.log("The collection has not changed.");
		}
		else
		{
			
			// Truncate albums.
			self.db.run("DELETE FROM albums");
			
			// Truncate tracks.
			self.db.run("DELETE FROM tracks");
			
			
			function fetchedAllMetadata(){
			
				console.log("Oh yeah, that's right, it's business time.");
				
				self.db.close(); // Business hours are over, baby.
				
			}
			
			// Mouse wheel.
			(function loopTracks(i){
			
				if ( paths.length+1 !== i )
				{
					// Get the metadata for the current path.
					self.getMetadata(self.collection_path + paths[i],function(data){
					
						console.log("Scanning " + i + " of " + paths.length + " (" + Math.floor((i/paths.length)*100) + "%)");
						
						// Pass the path 
						self.addTrackToCollection(data,paths[i]);
						
					},function(){
					
						loopTracks(i + 1);
						
					});
					
				} else {
			
					// We've run out of paths. Run the callback?
					fetchedAllMetadata(); // How many bloody callbacks are there, anyway?!?
				
				}
			
			})(0);
		
		}
	});

});