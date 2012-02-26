/**
 * Server
 * @description Socket.io server.
 */
function Server(){

	// make a socket.io instance and listen on the default port.
	var io = require('socket.io').listen(settings.get('port'));
	
	io.sockets.on('connection',function(socket){
	
		/**
		 * getArtists
		 * @description Returns an array of artist objects.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getArtists',function(callback){
		
			event.emit('queryCollection','SELECT name, id FROM artist WHERE name != "" ORDER BY name COLLATE NOCASE',function(err,res){
				
				if ( err ) throw err;
				
				else callback(res);
				
			});
		});
	
		/**
		 * getAlbums
		 * @description Lists all albums in the collection.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getAlbums',function(callback){
		
			event.emit('queryCollection','SELECT title, id FROM album WHERE TITLE != "" ORDER BY title COLLATE NOCASE'),function(err,res){
			
				if ( err ) throw err;
			
				callback(res);
			
			};
		
		});
		
		/**
		 * getGenres
		 * @description Lists all genres in the collection.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getGenres',function(callback){
		
			event.emit('queryCollection','SELECT DISTINCT genre FROM album WHERE genre != "" COLLATE NOCASE'),function(err,res){
			
				if ( err ) throw err;
			
				callback(res);
			
			};
		
		});
		
		/**
		 * getArtistAlbums
		 * @description Lists the albums belonging to a given artist.
		 * @param artist_id - the id of the artist to list albums for.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getArtistAlbums',function(artist_id,callback){
		
			event.emit('queryCollection','SELECT title, id, track_of FROM album WHERE artist_id = "' + artist_id + '"',function(err,res){
			
				if ( err ) throw err;
			
				callback(res);
			
			});
		
		});
		 
		/**
		 * getAlbumTracks
		 * @description Lists the tracks belonging to a given album.
		 * @param album_id - the id of the album to list tracks for.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getAlbumTracks',function(album_id,callback){
		
			event.emit('queryCollection','SELECT title, id, track_no FROM track WHERE album_id = "' + album_id + '"',function(err,res){
			
				if ( err ) throw err;
			
				callback(res);
			
			});
		
		});
		 
		/**
		 * getArtistTracks
		 * @description Lists all tracks belonging to a given artist.
		 * @param artist_id - the id of the artist to list albums for.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getArtistTracks',function(artist_id,callback){
		
			event.emit('queryCollection','SELECT title,id FROM track WHERE artist_id = "' + artist_id + '"',function(err,res){
			
				if ( err ) throw err;
				
				callback(res);
			
			});
		
		});
		 
		/**
		 * getAlbumArtURI
		 * @description Returns an array of URIs to album art. (small, medium, large.)
		 * @param artist - (string) Artist name.
		 * @param album - (string) Album name.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getAlbumArtURI',function(artist,album,callback){
	
			var request = require('request');
			
			var api_key = "6d97a6df16c5510dcd504956a0c6edb0";
			
			var uri = "http://ws.audioscrobbler.com/2.0/?format=json";
			
			var query = uri + "&api_key=" + api_key + "&method=album.getinfo&artist=" + encodeURIComponent(artist) + "&album=" + encodeURIComponent(album);
			
			request({uri: query },function(err,res,body){
			
				if (!err && res.statusCode == 200){
				
					var results = JSON.parse(body);
					
					if ( ! results.album )
					{
						callback("No Results with " + query);
						
					}
					else {
					
						callback(results.album.image,results.album.url);
					
					}
				
				}
			
			});
		
		});
	
	});
		
}

module.exports = Server;