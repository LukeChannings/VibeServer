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
	io.set('transports', [ 'flashsocket', 'websocket', 'htmlfile', 'xhr-polling' ]);
	
	var net = require("net"),
	    domains = [ settings.get('host') + ":" + settings.get('port')];
	
	net.createServer(
	    function(socket)
	    {
	        socket.write("<?xml version=\"1.0\"?>\n");
	        socket.write("<!DOCTYPE cross-domain-policy SYSTEM \"http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd\">\n");
	        socket.write("<cross-domain-policy>\n");
	
	        domains.forEach(
	            function(domain)
	            {
	                var parts = domain.split(':');
	                socket.write("<allow-access-from domain=\""+parts[0]+"\"to-ports=\""+(parts[1]||'80')+"\"/>\n");
	            }
	        );
	
	        socket.write("</cross-domain-policy>\n");
	        socket.end();   
	    }
	).listen(10843);
	
	// socket.io API methods.
	io.sockets.on('connection',function(socket){
	
		/**
		 * getArtists
		 * @description Returns an array of artist objects.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getArtists',function(callback){
		
			event.emit('queryCollection','SELECT name, id, albums FROM artist WHERE name != "" ORDER BY name COLLATE NOCASE',function(err,res){
				
				if ( typeof callback == "function" )
				{
					if ( err ) callback(err);
					else
					{
						callback(null,res);
					}
				}
				else
				{
					console.error("No callback specified for request.");
				}
			
			});
		});

		/**
		 * getArtistNameFromId
		 * @description get the name of the artist from an artist id.
		 * @param id (string) - artist id.
		 * @param callback (function) - function that will be sent the result.
		 */
		socket.on('getArtistNameFromId',function(id,callback){
		
			event.emit('queryCollection','SELECT name FROM artist WHERE id = "' + id + '"',function(err,res){
			
				if ( typeof callback == "function" )
				{
					if ( err ) callback(err);
					else
					{
						callback(null,res[0].name);
					}
				}
				else
				{
					console.error("No callback specified for request.");
				}
			
			});
		
		});

		/**
		 * getArtistsInGenre
		 * @description get a the metadata for all artists in a given genre.
		 * @param name (string) - genre name.
		 * @param callback (function) - function that will be sent the result.
		 */
		socket.on('getArtistsInGenre',function(name,callback){
		
			var artists = [];
			
			var async = require('async');
		
			event.emit('queryCollection','SELECT DISTINCT artist_id FROM album WHERE genre = "' + name + '"',function(err,res){
			
				async.forEachSeries(res,function(id,next){
				
					event.emit('queryCollection','SELECT name, id, albums FROM artist WHERE id = "' + id.artist_id + '"',function(err,artist){
					
						artists.push(artist[0]);
						
						next();
					
					});
				
				},function(){
				
					callback(err,artists);
				
				});
			
			});
		
		});

		/**
		 * getAlbums
		 * @description Lists all albums in the collection.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getAlbums',function(callback){
		
			event.emit('queryCollection','SELECT name, id, tracks, art_small, art_medium, art_large FROM album WHERE name != "" ORDER BY name COLLATE NOCASE',function(err,res){
				
				if ( typeof callback == "function" )
				{
					if ( err ) callback(err);
					else
					{
						callback(null,res);
					}
				}
				else
				{
					console.error("No callback specified for request.");
				}
			
			});
		
		});

		/**
		 * getAlbum
		 * @description returns the album metadata for the given album_id.
		 * @param id (string) - the album_id.
		 * @param callback (function) - the function that takes the result.
		 */
		socket.on('getAlbum',function(id,callback){
		
			event.emit('queryCollection','SELECT * FROM album WHERE id = "' + id + '"',function(err,res){
			
				if ( typeof callback == "function" )
				{
					if ( err ) callback(err);
					else
					{
						callback(null,res);
					}
				}
				else
				{
					console.error("No callback specified for request.");
				}
			
			});
		
		});
		
		/**
		 * getAlbumsByArtist
		 * @description Lists the albums belonging to a given artist.
		 * @param artist_id - the id of the artist to list albums for.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getAlbumsByArtist',function(artist_id,callback){
		
			event.emit('queryCollection','SELECT name, id, tracks, art_small, art_medium, art_large FROM album WHERE artist_id = "' + artist_id + '"',function(err,res){
			
				if ( typeof callback == "function" )
				{
					if ( err ) callback(err);
					else
					{
						callback(null,res);
					}
				}
				else
				{
					console.error("No callback specified for request.");
				}
			
			});
		
		});
		
		/**
		 * getTracks
		 * @description Lists all tracks in the collection.
		 * @param callback - (function) called when the data has been fetched.
		 */
		socket.on('getTracks',function(callback){
		
			event.emit('queryCollection','SELECT name, id, length, no FROM track WHERE name != ""',function(err,res){
			
				if ( typeof callback == "function" )
				{
					if ( err ) callback(err);
					else
					{
						callback(null,res);
					}
				}
				else
				{
					console.error("No callback specified for request.");
				}
			
			});
		
		});
		
		/**
		 * getTracksInGenre
		 * @description Lists all tracks in a genre..
		 * @param genre (string) - The name of the genre.
		 * @param callback (function) - Function to be sent the result.
		 */
		socket.on('getTracksInGenre',function(genre,callback){
		
			event.emit('queryCollection','SELECT track.name AS trackname, track.id AS trackid, album.name AS albumname, track.no AS trackno, album.tracks AS trackof, artist.name AS artistname, album.year AS year, track.length AS tracklength FROM track, album, artist WHERE track.album_id = album.id AND album.artist_id = artist.id AND album.genre = "' + genre + '"',function(err,res){
			
				if ( typeof callback == "function" )
				{
					if ( err ) callback(err);
					else
					{
						callback(null,res);
					}
				}
				else
				{
					console.error("No callback specified for request.");
				}
			
			});
		
		});
		
		/**
		 * getTracksByArtist
		 * @description Lists all tracks belonging to a given artist.
		 * @param artist_id - the id of the artist to list albums for.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getTracksByArtist',function(artist_id,callback){
		
			event.emit('queryCollection','SELECT track.name AS trackname, track.id AS trackid, album.name AS albumname, track.no AS trackno, album.tracks AS trackof, artist.name AS artistname, album.year AS year, track.length AS tracklength FROM track, album, artist WHERE track.album_id = album.id AND album.artist_id = artist.id AND artist.id = "' + artist_id + '"',function(err,res){
			
				if ( typeof callback == "function" )
				{
					if ( err ) callback(err);
					else
					{
						callback(null,res);
					}
				}
				else
				{
					console.error("No callback specified for request.");
				}
			
			});
		
		});
		
		/**
		 * getTracksInAlbum
		 * @description Lists the tracks belonging to a given album.
		 * @param album_id - the id of the album to list tracks for.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getTracksInAlbum',function(album_id,minimal,callback){
		
			if ( minimal )
			{
				var sql = 'SELECT track.name, track.id FROM track, album WHERE track.album_id = album.id AND album.id = "' + album_id + '"';
			}
			else
			{
				var sql = 'SELECT track.name AS trackname, track.id AS trackid, album.name AS albumname, track.no AS trackno, album.tracks AS trackof, artist.name AS artistname, album.year AS year, track.length AS tracklength FROM track, album, artist WHERE track.album_id = album.id AND album.artist_id = artist.id AND album.id = "' + album_id + '"';
			}
		
			event.emit('queryCollection',sql,function(err,res){
			
				if ( typeof callback == "function" )
				{
					if ( err ) callback(err);
					else
					{
						callback(null,res);
					}
				}
				else
				{
					console.error("No callback specified for request.");
				}
			
			});
		
		});
		
		/**
		 * getTrack
		 * @description Get the track metadata.
		 * @param album_id - the id of the album to list tracks for.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getTrack',function(track_id,callback){
		
			event.emit('queryCollection','SELECT track.name AS trackname, track.id AS trackid, album.name AS albumname, track.no AS trackno, album.tracks AS trackof, artist.name AS artistname, album.year AS year, track.length AS tracklength FROM track, album, artist WHERE track.album_id = album.id AND album.artist_id = artist.id AND track.id = "' + track_id + '"',function(err,res){
			
				if ( typeof callback == "function" )
				{
					if ( err ) callback(err);
					else
					{
						callback(null,res);
					}
				}
				else
				{
					console.error("No callback specified for request.");
				}
			
			});
		
		});
		
		/**
		 * getGenres
		 * @description Lists all genres in the collection.
		 * @param callback - function to be sent the result.
		 */
		socket.on('getGenres',function(callback){
		
			event.emit('queryCollection','SELECT DISTINCT genre FROM album WHERE genre != "" COLLATE NOCASE',function(err,res){
			
				if ( typeof callback == "function" )
				{
					if ( err ) callback(err);
					else
					{
						callback(null,res);
					}
				}
				else
				{
					console.error("No callback specified for request.");
				}
			
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
					
						if ( typeof callback == "function" ) callback(err);
						else console.error(err);
					}
				
				});
				
			}
		});
		
		/**
		 * search
		 * @description Finds entries matching the query in the collection.
		 * @param query (string) - text to search for.
		 * @param callback (function) - function to handle the results.
		 */
		socket.on('search',function(query,callback){
		
			if ( typeof query == 'string' && typeof callback == 'function' )
			{
				event.emit('queryCollection','SELECT track.name AS trackname, album.name AS albumname, album.id AS albumid, artist.name AS artistname, artist.id AS artistid, track.id AS trackid FROM track, album, artist WHERE track.album_id = album.id AND track.artist_id = artist.id AND track.name LIKE "%' + query + '%"',function(err,res){
				
					if ( err )
					{
						console.error(err);
					}
				
					callback(res);
				
				});
				
			}
		
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
					fs.stat(path,function(err,stats){
					
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
						
							var stream = fs.createReadStream(path);
							
							stream.on('data',function(data){
							
								res.write(data);
							
							});
							
							stream.on('end',function(){
							
								res.end();
							
							});
						
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
