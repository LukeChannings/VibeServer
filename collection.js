var sqlite = require('sqlite3');
var musicmetadata = require('musicmetadata');
var fs = require('fs');
var crypto = require('crypto');

/**
 * Collection
 * @description Manages the collection database.
 * @event addTrackToCollection 
 * @event queryCollection
 */
function Collection(callback){

	var self = this;

	// open an existing database.
	var sock = new sqlite.Database('musicme.db',sqlite.OPEN_READWRITE,function(err){
	
		// if there is no previous database, create a new one.
		if ( err ) createCollection();
		
		// if there is no problem then execute the callback.
		else if ( callback ) callback.call(self);
	});

	/**
	 * createCollection
	 * @description creates a database with the schema.
	 */
	function createCollection(){
		
		// create a new sqlite3 database.
		sock = new sqlite.Database('musicme.db');
		
		// clear the checksum.
		settings.set('collectionChecksum','');
		
		sock.serialize(function(){
		
			sock.run('PRAGMA foreign_keys = ON');

			sock.run('CREATE TABLE IF NOT EXISTS track(id VARCHAR(255) NOT NULL PRIMARY KEY,title VARCHAR(255) NOT NULL,path VARCHAR(255) NOT NULL,album_id VARCHAR(255) NOT NULL,duration SMALLTIME,track_no INT(4),plays INT(20),rating INT(1),FOREIGN KEY (album_id) REFERENCES album(id))');
			
			sock.run('CREATE TABLE IF NOT EXISTS album(id VARCHAR(255) NOT NULL PRIMARY KEY,title VARCHAR(255) NOT NULL,artist_id VARCHAR(255) NOT NULL,track_of INT(4),disk_no INT(4),disk_of INT(4),genre VARCHAR(255),year INT(5),art_uri VARCHAR(255),duration SMALLTIME,FOREIGN KEY (artist_id) REFERENCES artist(id))');
			
			sock.run('CREATE TABLE IF NOT EXISTS artist(id VARCHAR(255) NOT NULL PRIMARY KEY,name VARCHAR(255) NOT NULL,lastfm_uri VARCHAR(255))');
			
			sock.run('CREATE TRIGGER IF NOT EXISTS remove_album DELETE ON album BEGIN DELETE FROM track WHERE album_id = OLD.id; END');
			
			sock.run('CREATE TRIGGER IF NOT EXISTS remove_artist DELETE ON album BEGIN DELETE FROM album WHERE artist_id = OLD.id; END',function(){
			
				if ( callback ) callback.call(self);
			
			});
		
		});
		
	}
	
	/**
	 * getMetadata
	 * @description reads the metadata for a music file.
	 */
	function getMetadata(path,callback){
	
		var parser = new musicmetadata(fs.createReadStream(path));
		
		var metadata;
		
		parser.on('metadata',function(data){
			
			metadata = data;
			
		})
		
		parser.on('done',function(){
		
			callback(metadata);
		
			parser = null;
		
		});
	
	}
	
	/**
	 * addTrackToCollection
	 * @description adds a track to the database.
	 */
	this.addTrackToCollection = function(path,callback){
	
		getMetadata(path, function(metadata){
		
			if ( ! metadata ) throw "Bad metadata on " + path;
		
			sock.serialize(function(){
			
				// make ids.
				var artistid = crypto.createHash('md5').update(metadata.artist.join('')).digest("hex");
				var albumid = crypto.createHash('md5').update(metadata.artist.join('') + metadata.album).digest("hex");
				var trackid = crypto.createHash('md5').update(metadata.album + metadata.title).digest("hex");;
			
				// Insert artist.
				sock.run('INSERT OR IGNORE INTO artist (id,name) VALUES("' + artistid + '","' + metadata.artist.join('') + '")')
			
				// Insert album.
				sock.run('INSERT OR IGNORE INTO album (id,title,track_of,disk_no,disk_of,artist_id,year,genre) VALUES(?,?,?,?,?,?,?,?)',
				{
					1: albumid,
					2: metadata.album,
					3: metadata.track.of,
					4: metadata.disk.no,
					5: metadata.disk.of,
					6: artistid,
					7: metadata.year,
					8: metadata.genre.join('')
				});
			
				// insert track.
				sock.run('INSERT INTO track (id,title,path,track_no,album_id) VALUES(?,?,?,?,?)',
				{
					1: trackid,
					2: metadata.title,
					3: encodeURIComponent(path),
					4: metadata.track.no,
					5: albumid
				},function(){
				
					// when we're done run the callback.
					callback();
				
				});
				
			});
			
		});
	
	}
	
	this.removeTrackFromCollection = function(path,callback){
	
		// there is something to remove
		if ( path )
		{
			sock.run("DELETE FROM track WHERE path = ?", [path]);
			
			if ( callback ) callback();
			
		}
	
	}

	this.removeAlbumFromCollection = function(){}
	
	this.removeArtistFromCollection = function(){}

	// event listeners.
	event.on('addTrackToCollection',function(path,callback){
	
		if ( !path ) console.error('Collection unable to handle "addTrackToCollection" event. No path.');
	
		self.addTrackToCollection(path,callback);
		
	});

	event.on('removeTrackFromCollection',function(path,callback){
	
		if ( !path ) console.error("Collection unable to handle 'removeTrackFromCollection' request. No path");
	
		self.removeTrackFromCollection(path,callback);
	
	});

	event.on('queryCollection',function(sql,callback){

			sock.run(sql,callback);
	
	});
	
	event.on('queryCollectionGet',function(sql,callback){});

	event.on('queryCollectionAll',function(sql,callback){
	
		sock.all(sql,callback);
	
	});

	event.on('queryCollectionEach',function(sql,callback){});

}

module.exports = Collection;