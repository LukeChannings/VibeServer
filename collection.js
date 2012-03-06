var sqlite = require('sqlite3');
var fs = require('fs');
var crypto = require('crypto');
var taglib = require('taglib');

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

			// define track.
			sock.run('CREATE TABLE track(id VARCHAR(255),album_id VARCHAR(255),artist_id VARCHAR(255),name VARCHAR(255),path VARCHAR(255),no INT(10),length INT(10),bitrate INT(10),samplerate INT(10),PRIMARY KEY(id),FOREIGN KEY(album_id) REFERENCES album(id),FOREIGN KEY(artist_id) REFERENCES artist(id))');
			
			// define album.
			sock.run('CREATE TABLE album(id VARCHAR(255),artist_id VARCHAR(255),name VARCHAR(255),year INT(5),genre VARCHAR(255),art_resource VARCHAR(255),tracks INT(5),PRIMARY KEY(id),FOREIGN KEY(artist_id) REFERENCES artist(id))');
			
			// define artist.
			sock.run('CREATE TABLE artist(id VARCHAR(255),name VARCHAR(255),albums INT(10),art_resource VARCHAR(255),PRIMARY KEY(id))',function(){
				
				if ( callback ) callback();
				
			});
		
		});
		
	}
	
	/**
	 * getMetadata
	 * @description reads the metadata for a music file.
	 */
	function getMetadata(path,callback){
	
		// if there is no path then callback with error.
		if ( ! path )
		{
			callback("No path.");
			return;
		}
	
		// get the metadata.
		var data = {
			tags : new taglib.Tag(path),
			properties : new taglib.AudioProperties(path)
		}
	
		// calculate hashes.
		var artistid = crypto.createHash('md5').update(data.tags.artist).digest("hex");
		var albumid = crypto.createHash('md5').update(data.tags.artist + data.tags.album).digest("hex");
		var trackid = crypto.createHash('md5').update(data.tags.title + data.tags.album).digest("hex");
	
		// check if the metadata is broken.
		if ( (artistid == albumid) && (albumid == trackid) )
		{
			// callback with error.
			callback("Bad Metadata",{path : path});
			return;
		}
		
		// return metadata object.	
		callback(false,{
			"track" : {
				"id" : trackid,
				"album_id" : albumid,
				"artist_id" : artistid,
				"name" : data.tags.title,
				"path" : path,
				"index" : data.tags.track,
				"length" : data.properties.length,
				"bitrate" : data.properties.bitrate,
				"samplerate" : data.properties.sampleRate
			},
			"album" : {
				"id" : albumid,
				"artist_id" : artistid,
				"name" : data.tags.album,
				"year" : parseInt(data.tags.year),
				"genre" : data.tags.genre,
				"art_resource" : "",
				"track_count" : 0
			},
			"artist" : {
				"id" : artistid,
				"name" : data.tags.artist,
				"art_resource" : ""
			}
		});
		
		// cleanup.
		delete data.tags;
		delete data.properties;
		
		return 0;
	}
	
	/**
	 * addTrackToCollection
	 * @description adds a track to the database.
	 */
	this.addTrackToCollection = function(path,callback){
	
		getMetadata(path, function(err,metadata){

			if ( err )
			{
				// log the error.
				if ( err == "Bad Metadata." ) console.error("Skipping " + metadata.path + ' ' + err);
				else console.error(err);
				
				// go to the next track.
				callback();
			}
			else
			{
				sock.serialize(function(){

					// insert artist.
					sock.run('INSERT OR IGNORE INTO artist (id,name) VALUES(?,?)',[
						metadata.artist.id,
						metadata.artist.name
					]);
					
					// insert album.
					sock.run('INSERT OR IGNORE INTO album (id,artist_id,name,year,genre) VALUES(?,?,?,?,?)',[
						metadata.album.id,
						metadata.album.artist_id,
						metadata.album.name,
						metadata.album.year,
						metadata.album.genre
					]);
					
					// insert track.
					sock.run('INSERT INTO track (id,album_id,artist_id,name,path,no,length,bitrate,samplerate) VALUES(?,?,?,?,?,?,?,?,?)',[
						metadata.track.id,
						metadata.track.album_id,
						metadata.track.artist_id,
						metadata.track.name,
						metadata.track.path,
						metadata.track.index,
						metadata.track.length,
						metadata.track.bitrate,
						metadata.track.samplerate
					],function(){
						
						if ( callback ) process.nextTick(function(){
						
							callback();
						
						});
					
					});
				
				});
			}
		});
	
	}
	
	/**
	 * removeTrackFromCollection
	 * @description removes a track from the collection.
	 */
	this.removeTrackFromCollection = function(path,callback){
	
		// there is something to remove
		if ( path )
		{
			sock.run("DELETE FROM track WHERE path = ?", [path]);
			
			if ( callback ) callback();
			
		}
	
	}

	/**
	 * postScan
	 * @description Meta-method for running postAdd and postDel.
	 */
	this.postScan = function(callback){
	
		// run postAdd.
		self.postAdd(function(){
		
			// once postAdd has finished, run postDel.
			self.postDel(function(){
			
				// once postDel has finished run the callback. (if there is one.)
				if ( callback ) callback();
			
			});
		
		});
	
	}

	/**
	 * postAdd
	 * @description updates collection metadata after adding tracks. Sets number of children for artists and albums, and gets albumart.
	 * @param callback - (function) Called once postAdd has finished.
	 */
	this.postAdd = function(callback){
	
		/**
		 * countAlbumTracks
		 * @description counts the number of tracks that belong to an album and updates the database attribute.
		 * @param data - (array) an array of album IDs.
		 * @param callback - (function) function to be executed once the function has finished. 
		 */
		function countAlbumTracks(data,callback){
		
			// next loop.
			(function next(i){
			
				// if we've reached the final id
				if ( ! data[i] )
				{
					// execute the callback.
					if ( callback ) callback();
				}
				else
				{
					// get the number of tracks belonging to an album.
					event.emit('queryCollection','SELECT count(*) FROM track WHERE album_id = "' + data[i].id + '"',function(err,res){
					
						// if the query failed log the error to stderr.
						if ( err ) console.error(err);
					
						// parse the result.
						var count = parseInt(res[0]['count(*)']);
					
						// if the album has no tracks...
						if ( count === 0 )
						{
							// delete the album from the database. (cleans entries orphaned by SCAN_DEL.)
							event.emit('queryCollection','DELETE FROM album WHERE id = "' + data[i].id + '"',function(){next(++i)});
						}
						else{
							
							// update the album track count.
							event.emit('queryCollection','UPDATE album SET track_count = ' + count + ' WHERE id = "' + data[i].id + '"',function(){next(++i)});
							
						}
						
					});
				}
			})(0);
		
		}
	
		/**
		 * countArtistAlbums
		 * @description counts the number of albums that belong to an artist and updates the database attribute.
		 * @param data - (array) an array of artist IDs.
		 * @param callback - (function) function to be executed once the function has finished. 
		 */
		function countArtistAlbums(data,callback){
		
			// next loop.
			(function next(i){
			
				// if we've reached the final id
				if ( ! data[i] )
				{
					// execute the callback.
					if ( callback ) callback();
				}
				else
				{
					// get the number of albums belonging to an artist.
					event.emit('queryCollection','SELECT count(*) FROM album WHERE artist_id = "' + data[i].id + '"',function(err,res){
					
						// if the query failed log the error to stderr.
						if ( err ) console.error(err);
					
						// parse the result.
						var count = parseInt(res[0]['count(*)']);
					
						// if the artist has no albums...
						if ( count === 0 )
						{
							// delete the artist from the database.  (cleans entries orphaned by SCAN_DEL.)
							event.emit('queryCollection','DELETE FROM artist WHERE id = "' + data[i].id + '"',function(){next(++i)});
						}
						else{
							
							// update the artist album count.
							event.emit('queryCollection','UPDATE artist SET album_count = ' + count + ' WHERE id = "' + data[i].id + '"',function(){next(++i)});
							
						}
						
					});
				}
			})(0);
		
		}
		
		function getAlbumArt(){}
	
		// list all album IDs.
		event.emit('queryCollection','SELECT id FROM album',function(err,data){
		
			// log any errors
			if ( err ) console.error(err);
		
			// send the data to countAlbumTracks.
			countAlbumTracks(data,function(){
			
				// when countAlbumTracks has finished list artist IDs.
				event.emit('queryCollection','SELECT id FROM artist',function(err,data){
				
					// log any errors
					if ( err ) console.error(err);
				
					// pass the ids to countArtistAlbums.
					countArtistAlbums(data,function(){
					
						// when countArtistAlbums has finished run the callback.
						if ( callback ) callback();
					
					});
				
				});
			
			});
		
		});
	
	}
	
	/**
	 * postDel
	 * @description updates collection metadata after deleting tracks. Deletes orphaned artists or albums.
	 * @param callback - (function) Called once postDel has finished.
	 */
	this.postDel = function(callback){}

	// event listeners.
	event.on('addTrackToCollection',function(path,callback){
	
		if ( ! path ) console.error('Collection unable to handle "addTrackToCollection" event. No path.');
	
		self.addTrackToCollection(path,callback);
		
	});

	event.on('removeTrackFromCollection',function(path,callback){
	
		if ( ! path ) console.error("Collection unable to handle 'removeTrackFromCollection' request. No path");
	
		self.removeTrackFromCollection(path,callback);
	
	});

	event.on('queryCollection',function(sql,callback){
	
		sock.all(sql,callback);
	
	});

	event.on('postScan',function(callback){
		
		self.postScan(callback);
		
	});

}

module.exports = Collection;
