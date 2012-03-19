var sqlite = require('sqlite3');
var fs = require('fs');
var crypto = require('crypto');
var probe = require('node-ffprobe');
var async = require('async');

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
		settings.unset('collection_checksum');
		
		sock.serialize(function(){
		
			sock.run('PRAGMA foreign_keys = ON');

			// define track.
			sock.run('CREATE TABLE track(id VARCHAR(255),album_id VARCHAR(255),artist_id VARCHAR(255),name VARCHAR(255),path VARCHAR(255),no INT(10),length INT(10),bitrate INT(10),samplerate INT(10),PRIMARY KEY(id),FOREIGN KEY(album_id) REFERENCES album(id),FOREIGN KEY(artist_id) REFERENCES artist(id))');
			
			// define album.
			sock.run('CREATE TABLE album(id VARCHAR(255),artist_id VARCHAR(255),name VARCHAR(255),year INT(5),genre VARCHAR(255),art_resource VARCHAR(255),tracks INT(5),PRIMARY KEY(id),FOREIGN KEY(artist_id) REFERENCES artist(id))');
			
			// define artist.
			sock.run('CREATE TABLE artist(id VARCHAR(255),name VARCHAR(255),albums INT(10),art_resource VARCHAR(255),PRIMARY KEY(id))',function(){
				
				if ( callback ) callback.call(self);
				
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
	
		probe(path,function(data){
		
			// calculate hashes.
			var id = {
				"artist" : crypto.createHash('md5').update(data.metadata.artist).digest("hex"),
				"album" : crypto.createHash('md5').update(data.metadata.artist + data.metadata.album).digest("hex"),
				"track" : crypto.createHash('md5').update(data.metadata.title + data.metadata.album).digest("hex")
			}
			
			// gather track index data.
			var index = {
				no : ( typeof data.metadata.track == "string" ) ? parseInt(data.metadata.track.split('/')[0]) : data.metadata.track,
				of : ( typeof data.metadata.track == "string" ) ? parseInt(data.metadata.track.split('/')[1]) : 0
			}
		
			callback({
				"track" : {
					"id" : id.track,
					"album_id" : id.album,
					"artist_id" : id.artist,
					"name" : data.metadata.title,
					"path" : path,
					"index" : index.no,
					"length" : data.format.duration,
					"bitrate" : data.format.bit_rate,
					"samplerate" : data.streams[0].sample_rate
				},
				"album" : {
					"id" : id.album,
					"artist_id" : id.artist,
					"name" : data.metadata.album,
					"year" : parseInt(data.metadata.date),
					"genre" : data.metadata.genre,
					"track_count" : index.of
				},
				"artist" : {
					"id" : id.artist,
					"name" : data.metadata.artist
				}
			});
		
		});
				
		return 0;
	}
	
	/**
	 * bindEventHandler
	 * @description Simple method to bind an event to a method.
	 * @param eventName (string) - name of the event to listen to.
	 * @param eventHandler (function) - the method to call when the event is emitted.
	 */
	function bindEventHandler(eventName,eventHandler){
		
		if ( typeof eventName == "string" && typeof eventHandler == "function" )
		{
			event.on(eventName,eventHandler);
		}
		else
		{
			console.error("Could not listen to '" + eventName + "' as its handler is invalid.");
		}
	}
	
	/**
	 * addTrackToCollection
	 * @description adds a track to the database.
	 */
	this.addTrackToCollection = function(path,callback){

		getMetadata(path, function(metadata){

			if ( ! metadata )
			{
				// log the error.
				console.error("Skipping " + path);
				
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
	 * @description removes a track from the database.
	 */
	this.removeTrackFromCollection = function(path,callback){
	
		event.emit('queryCollection','DELETE FROM track WHERE path = "' + path + '"',callback);
	
	}
	
	/**
	 * postScan
	 * @description updates collection metadata after adding tracks. Sets number of children for artists and albums, and gets albumart.
	 * @param callback - (function) Called once postAdd has finished.
	 */
	this.postScan = function(callback){
	
		// get a list of albums.
		event.emit('queryCollection','SELECT id FROM album',function(err,data){
		
			// loop through the albums.
			async.forEachSeries(data,function(album,next){
			
				// find the number of tracks in the current album.
				event.emit('queryCollection','SELECT count(*) FROM track WHERE album_id = "' + album.id + '"',function(err,data){
				
					// parse the result into an integer.
					var tracks = parseInt(data[0]["count(*)"]);
				
					// if there are no tracks for the album.
					if ( tracks === 0 )
					{
						// delete the album.
						event.emit('queryCollection','DELETE FROM album WHERE id = "' + album.id + '"',function(err){
						
							if ( err ) console.error(err);
						
							process.nextTick(next);
						
						});
						
					}
					else {
					
						// update the collection attribute.
						event.emit('queryCollection','UPDATE album SET tracks = ' + tracks + ' WHERE id = "' + album.id + '"',function(err){
						
							if ( err ) console.error(err);
						
							process.nextTick(next);
						
						});
						
					}
				
				});
			
			},function(){
			
				// get a list of artists.
				event.emit('queryCollection','SELECT id FROM artist',function(err,data){
				
					// loop through the artists.
					async.forEachSeries(data,function(artist,next){
					
						// find the number of albums belonging to this artist.
						event.emit('queryCollection','SELECT count(*) FROM album WHERE artist_id = "' + artist.id + '"',function(err,data){
						
							var albums = parseInt(data[0]["count(*)"]);
						
							if ( albums == 0 )
							{
								event.emit('queryCollection','DELETE FROM artist WHERE id = "' + artist.id + '"',function(err){
								
									if ( err ) console.error(err);
									
									process.nextTick(next);
									
								});
							}
							else
							{
								event.emit('queryCollection','UPDATE artist SET albums = ' + albums + ' WHERE id = "' + artist.id + '"',function(err){
								
									if ( err ) console.error(err);
								
									process.nextTick(next);
								
								});
							}
						
						});
					
					},function(){
					
						if ( callback ) callback();
					
					});
				
				});
			
			});
		
		});
				
	}

	// event listeners.
	bindEventHandler('addTrackToCollection',self.addTrackToCollection);
	bindEventHandler('removeTrackFromCollection',self.removeTrackFromCollection);
	bindEventHandler('queryCollection',function(sql,callback){
		
		sock.all(sql,callback);
		
	});
	bindEventHandler('postScan',self.postScan);

}

module.exports = Collection;
