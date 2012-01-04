/**
 * MusicMe Server API
 * @description MusicMe HTTP Server.
 */
function APIServer(){

	// make an object for MIME types.
	this.mime = {
		"mp3" : "audio/mpeg",
		"ogg" : "audio/ogg",
		"wav" : "audio/wave",
		"aac" : "audio/aac",
		"flac" : "audio/x-flac"
	}

	var self = this;

	io.sockets.on('connection',function(socket){

		// be generous, make socket a global.
		global.socket = socket;

		socket.on('getArtists',function(callbackEvent){
		
			self.getArtists(function(data){
				
				socket.emit(callbackEvent,data);
				
			})
		
		});
		
		socket.on('getAlbums',function(callbackEvent){
		
			self.getAlbums(function(data){
				
				socket.emit(callbackEvent,data);
				
			});
		
		})
		
		socket.on('getTracks',function(callbackEvent){
		
			self.getTracks(function(data){
			
				socket.emit(callbackEvent,data);
			
			});
		
		});
		
		socket.on('getAlbumTracks',function(album,callbackEvent){
		
			if ( ! album ) console.log("getAlbumTracks needs an album.");
		
			self.getAlbumTracks(album,function(data){
			
				socket.emit(callbackEvent,data);
			
			});
		
		});
		
		socket.on('getAlbumTracksByHash',function(hash,callbackEvent){
		
			if ( ! hash ) console.log("getAlbumTracksByHash needs a hash.");
		
			self.getAlbumTracksByHash(hash,function(data){
			
				socket.emit(callbackEvent,data);
			
			});
		
		});
		
		socket.on('getArtistAlbums',function(artist,callbackEvent){
		
			self.getArtistAlbums(artist,function(data){
			
				socket.emit(callbackEvent,data);
			
			});
		
		});
		
		socket.on('updateCollection',function(callbackEvent){
		
			self.updateCollection(function(result){

				socket.emit(callbackEvent,result);
			
			});
			
		});
		
		socket.on('forceUpdateCollection',function(callbackEvent){
		
			self.forceUpdateCollection(function(result){
			
				socket.emit(callbackEvent,result);
			
			});
		
		});
	
		socket.on('getCollectionStatistics',function(callbackEvent){
		
			self.getCollectionStatistics(function(data){
			
				socket.emit(callbackEvent,data);
			
			});
		
		})
		
	});
}

/**
 * getArtists
 * @description Creates a response to a request for all artists.
 * @object req - the request.
 * @object res - the response.
 */
APIServer.prototype.getArtists = function(callback){

	var artists = [];
	
	db.each('SELECT DISTINCT artist FROM albums ORDER BY artist',function(err,row){
	
		if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
		
		if ( row ) artists.push(row.artist);
	
	},function(){
		
		if ( typeof callback === 'function' ) callback(artists);
		
	});

}

/**
 * getAlbums
 * @description Creates a response to a request for all albums.
 * @object req - the request.
 * @object res - the response.
 */
APIServer.prototype.getAlbums = function(callback){

	var albums = [];
	
	db.each('SELECT DISTINCT album FROM albums ORDER BY album',function(err,row){
	
		if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
		
		if ( row ) albums.push(row.album);
	
	},function(){
		
		if ( typeof callback === 'function' ) callback(albums);
		
	});
}

/**
 * getTracks
 * @description Creates a response to a request for all tracks.
 * @object req - the request.
 * @object res - the response.
 * @object req - the request.
 * @object res - the response.
 */
APIServer.prototype.getTracks = function(callback){

	var tracks = [];
	
	db.each('SELECT hash, title, album, trackno FROM tracks ORDER BY album',function(err,row){
	
		if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
		
		if ( row ) tracks.push(row);
	
	},function(){
		
		if ( typeof callback === 'function' ) callback(tracks);
		
	});
	
}

/**
 * getAlbumTracks
 * @description Responds with a list of tracks in an album.
 * @object req - the request.
 * @object res - the response.
 * @string album - the album.
 */
APIServer.prototype.getAlbumTracks = function(album,callback){

	if ( typeof callback !== 'function' || ! album ) throw "APIServer::getAlbumTracks is missing parameters."; 

	var tracks = [];
	
	db.each('SELECT hash,title,trackno FROM tracks WHERE album = ?',album,function(err,row){
	
		if ( !err ) tracks.push(row);
	
		else throw err;
	
	},function(){
	
		callback(tracks);
	
	});

}

/**
 * getAlbumTracksByHash
 * @description Creates a response to a request for the tracks in an album.
 * @object req - the request.
 * @object res - the response.
 * @string hash - the album unique hash.
 */
APIServer.prototype.getAlbumTracksByHash = function(hash,callback){

	if ( typeof callback !== 'function' || ! hash ) throw "APIServer::getAlbumTracksByHash is missing parameters.";
	
	var tracks = [];
	
	db.each('SELECT * FROM tracks INNER JOIN albums ON tracks.album=albums.album WHERE albums.hash = ?',hash,function(err,row){
	
		if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
		
		if ( row ) tracks.push(row);
	
	},function(){
		
		callback(tracks);
		
	});

}

/**
 * getArtistAlbums
 * @description Creates a response to a request for a request for all albums by an artist.
 * @object req - the request.
 * @object res - the response.
 * @string artist - the name of the artist to list albums for.
 */
APIServer.prototype.getArtistAlbums = function(artist,callback){
	
	if ( typeof callback !== 'function' || ! artist ) throw "APIServer::getArtistsAlbums is missing parameters.";
	
	artist = decodeURIComponent(artist);

	var albums = [];
	
	db.each('SELECT * FROM albums WHERE artist LIKE ?',artist,function(err,row){
	
		if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
		
		if ( row ) albums.push(row);
	
	},function(){
		
		callback(albums);
		
	});
	
}

/**
 * updateCollection
 * @description Updates the collection. Responds with the shouldIScan decision.
 * @object req - the request.
 * @object res - the response.
 */
APIServer.prototype.updateCollection = function(callback){

	if ( ! callback ) throw "APIServer::updateCollection is missing a callback.";
	
	// if we're already scanning then don't allow an update to be run again.
	if ( scanning ){
	
		callback({iShouldScan : false, alreadyScanning : true});
		
	}
	else{
	
		emitter.on('updateCollectionCallback',function(data){
		
			callback(data);
		
		});
	
		emitter.emit('scanCollection','updateCollectionCallback');
	
	}
}

/**
 * forceUpdateCollection
 * @description re-scan the collection.
 * @object req - the request.
 * @object res - the response.
 */
APIServer.prototype.forceUpdateCollection = function(callback){
	
	if ( !callback ) throw "APIServer::forceUpdateCollection is missing a callback.";
	
	// if we're already scanning then don't allow an update to be run again.
	if ( scanner.scanning ){
	
		callback({shouldIScan : false, alreadyScanning : true});
		
		return;
	}
	
	// Truncate the collection before updating.
	core.truncateCollection(function(){
	
		updateCollection(function(result){
		
			callback(result);
		
		});
	
	});

}

/**
 * stream
 * @description Returns the stream for a track corresponding to a hash.
 * @object req - the request.
 * @object res - the response.
 * @string hash - the track hash.

APIServer.prototype.stream = function(req,res,hash){

	db.get('SELECT path FROM tracks WHERE hash=?',{ 1 : hash },function(err,row){
	
		if ( err || ! row )
		{
			res.writeHead(404, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
			res.end(JSON.stringify(err));
		}
		else{
			
			fs.readFile(row.path,function(err,data){
				
				if ( err )
				{
					res.writeHead(404, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
					res.end(JSON.stringify(err));
				}
				else{
					
					// get the file extension.
					var extension = row.path.match(/\.(.+)$/)[1];
					
					res.writeHead(200, {'Content-Type': mime[extension] } );
					res.end(data);
				}
				
			});
			
		}
	});
}
*/

/**
 * getCollectionStatistics
 * @description fetches the collection statistics.
 * @function callback - executed when statistics have been updated. 
 */
APIServer.prototype.getCollectionStatistics = function(callback){

	if ( typeof callback !== 'function' ) throw "APIServer::getCollectionStatistics is missing a callback.";

	// make an object to contain the results.
	var results = {};

	// check if the collection is being scanned.
	if ( scanner.scanning ){
	
		// set the number of items being scanned.
		results.itemsToScan = scanner.scanning.of;
		
		// set the current item being scanned.
		results.itemsScanned = scanner.scanning.no;
	
	}

	// execute the following SQL in sequence.
	db.serialize(function(){
	
		// determine the number of artists.
		db.get('SELECT count(DISTINCT artist) FROM albums',function(err,row){
			
			if ( ! err ) results.artistCount = row['count(DISTINCT artist)'];
			
			else throw err;
			
		});
	
		// determine the number of albums.
		db.get('SELECT count(album) FROM albums',function(err,row){
			
			if ( ! err ) results.albumCount = row['count(album)'];
			
			else throw err;
			
		});
	
		// determine the number of tracks.
		db.get('SELECT count(title) FROM tracks',function(err,row){
		
			if ( ! err ) results.trackCount = row['count(title)'];
			
			else throw err;
		
		});
	
		// determine the number of genres.
		db.get('SELECT count(genre) FROM albums',function(err,row){
		
			if ( ! err ) results.genreCount = row['count(genre)'];
			
			else throw err;
		
		},function(){
		
			callback(results);
		
		});
	
	});

}

module.exports = APIServer;