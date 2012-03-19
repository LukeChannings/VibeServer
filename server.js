/**
 * Server
 * @description Socket.io server.
 */
function Server(){

	var http = require('http');

	// make an HTTP server.
	var httpServer = http.createServer().listen(settings.get('port'));

	// make a socket.io instance and listen on the default port.
	var io = require('socket.io').listen(httpServer);
	
	// socket.io configuration.
	io.enable('browser client minification');
	io.enable('browser client gzip');
	io.set('log level', 1);
	io.set('transports', ['websocket','flashsocket','jsonp-polling']);
	
	// socket.io API methods.
	io.sockets.on('connection',function(socket){
	
		/**
		 * getArtists
		 * @description Returns an array of artist objects.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getArtists',function(callback){
		
			event.emit('queryCollection','SELECT name, id, albums FROM artist WHERE name != "" ORDER BY name COLLATE NOCASE',function(err,res){
				
				if ( err ) console.error(err);
				
				else{
				
					callback(res);
				
				}
			});
		});
	
		/**
		 * getAlbums
		 * @description Lists all albums in the collection.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getAlbums',function(callback){
		
			event.emit('queryCollection','SELECT title, id, tracks FROM album WHERE title != "" ORDER BY title COLLATE NOCASE'),function(err,res){
			
				if ( err ) console.error(err);
			
				callback(res);
			
			};
		
		});
		
		/**
		 * getTracks
		 * @description Lists all tracks in the collection.
		 * @param callback - (function) called when the data has been fetched.
		 */
		socket.on('getTracks',function(callback){
		
			event.emit('queryCollection','SELECT title, id, length, track_no FROM track WHERE title != ""',function(err,res){
			
				if ( err ) console.error(err);
				
				callback(res);
			
			});
		
		});
		
		/**
		 * getGenres
		 * @description Lists all genres in the collection.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getGenres',function(callback){
		
			event.emit('queryCollection','SELECT DISTINCT genre FROM album WHERE genre != "" COLLATE NOCASE'),function(err,res){
			
				if ( err ) console.error(err);
			
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
		
			event.emit('queryCollection','SELECT name, id, tracks FROM album WHERE artist_id = "' + artist_id + '"',function(err,res){
			
				if ( err ) console.error(err);
			
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
		
			event.emit('queryCollection','SELECT name, id, no, length, bitrate, samplerate FROM track WHERE album_id = "' + album_id + '"',function(err,res){
			
				if ( err ) console.error(err);
			
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
		
			event.emit('queryCollection','SELECT name,id FROM track WHERE artist_id = "' + artist_id + '"',function(err,res){
			
				if ( err ) console.error(err);
				
				callback(res);
			
			});
		
		});
		
		/**
		 * setRating
		 * @description set a rating for a track.
		 * @param track_id (string) - ID for the track we're setting the rating for.
		 * @param rating (int) - The rating of the track. (0-5)
		 * @param callback (function) - called once the operation is complete. (Returns true or false for success status.)
		 */
		socket.on('setRating',function(track_id,rating,callback){
		
			// check for an ID and rating to set.
			if ( track_id && rating )
			{
				// update the track entry with the new rating.
				event.emit('queryCollection','UPDATE track SET rating=' + parseInt(rating) + ' WHERE id = "' + track_id + '"',function(err){
				
					if ( err ){
					
						// callback with the error.
						if ( callback ) callback(err);
						
						// throw the error.
						console.error(err);
					}
					else {
					
						// callback when we're done.
						if ( callback ) callback();
					
					}
				
				});
				
			}
		});
		
		/**
		 * scanningStatus
		 * @description Returns the status of the Scanner.
		 */
		socket.on('scanningStatus',function(callback){
		
			event.emit('scanningStatus',function(status){
			
				socket.emit(callback,status);
			
			});
		
		});
		
	});
	
	/**
	 * stream
	 * @description Handles stream requests.
	 * @uri_scheme /stream/:track_id
	 */
	httpServer.on('request',function(req,res){
	
		// if the request is for a stream but an id is not provided.
		if ( /\/stream\/?$/.test(req.url) )
		{
			// Return the required URI scheme.
			res.end("Use /stream/:track_id");
		}
		
		// if there is a request and an id is present.
		else if ( /\/stream\/.+/.test(req.url) )
		{
			// get the id of the track.
			var track_id = req.url.match(/\/stream\/(.+)/)[1];
			
			// get the path of the track.
			event.emit('queryCollection','SELECT path FROM track WHERE id = "' + track_id + '"',function(err,result){
			
				// if there was an error fetching then throw it.
				if ( err ) console.error(err);
				
				// if the specified id doesn't match anything in the database...
				if ( ! result[0] ){
				
					// send a 404.
					res.statusCode = "404 Not Found";
					
					// end the response.
					res.end("No track matching specified ID found in the collection.");
				
				}
				
				// if there was a result..
				else {
					
					// decode the path.
					var path = decodeURIComponent(result[0].path);
					
					// require the filesystem module.
					var fs = require('fs');
					
					// tell the client we accept 206.
					res.setHeader("Accept-Ranges", "bytes");
					
					// determine the MIME type.
					var MIME = ( ! path.match(/\.ogg$/) ) ? 'audio/mpeg' : 'audio/ogg';
					
					// set the MIME.
					res.setHeader('Content-Type',MIME);
					
					// get the file statistics.
					var stat = fs.stat(path,function(err,stats){
					
						if ( !stats )
						{
						
							console.error(path + " does not exist.");
						
							return;
						}
					
						// get the length of the file.
						var total = stats.size;
						
						// if there is no range request.
						if ( ! req.headers.range )
						{
							// send the full file.
							res.end(fs.readFile(path));
						
						}
						
						// if there is a range request... (the fun begins..)
						else
						{
							// get the range.
							var range = req.headers.range.match(/=(.+)-(.*)/);
							
							// get the range start.
							var start = parseInt(range[1]);
							
							// get the range end.
							var end = parseInt(range[2]) || total - 1;
							
							// calculate the number of bytes to be sent.
							var chunks = (end - start) + 1;
							
							// tell the client we're sending partial content.
							res.statusCode = "206 Partial Content";
							
							// tell the client the range of bytes we're sending.
							res.setHeader("Content-Range","bytes " + start + "-" + end + "/" + total);
							
							// tell the client the number of bytes we're sending.
							res.setHeader("Content-Length", chunks);
							
							// read in the byte range.
							var stream = fs.createReadStream(path,{start: start, end: end});
							
							// when we have data.
							stream.on('data',function(data){
							
								// send it to the client.
								res.write(data);
							
							});
							
							// when we run out of data.
							stream.on('end',function(){
								
								// end our response.
								res.end();
							
							})
							
						}
					});
					
				}
			
			});
		}
	
	});
	
}

module.exports = Server;