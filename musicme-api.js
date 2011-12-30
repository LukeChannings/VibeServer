var http = require('http');
var router = require('choreographer').router();
var fs = require('fs');

/**
 * MusicMe Server API
 * @description MusicMe HTTP Server.
 */
function APIServer(Core,Scanner){
	
	// make stuff global. (sad, I know.)
	db = Core.db;
	scanner = Scanner;
	core = Core;
	
	// make an object for MIME types.
	mime = this.mime = {
		"mp3" : "audio/mpeg",
		"ogg" : "audio/ogg",
		"wav" : "audio/wave",
		"aac" : "audio/aac",
		"flac" : "audio/x-flac"
	}
	
	// define the routes.
	router
	.get('/',this.info)
	.get('/collection',this.info)
	.get('/collection/artists',this.getArtists)
	.get('/collection/albums',this.getAlbums)
	.get('/collection/tracks',this.getTracks)
	.get('/collection/album/*',this.getAlbumTracksByHash)
	.get('/collection/albums/*',this.getArtistsAlbums)
	.get('/collection/update',this.updateCollection)
	.get('/stream',this.info)
	.get('/stream/*',this.stream)
	
	// run the server.
	http.createServer(router).listen(core.api_port);
	
	// tell people that the server is running.
	console.log("API running on port " + core.api_port + ".");
	
}

/**
 * getArtists
 * @description Creates a response to a request for all artists.
 * @object req - the request.
 * @object res - the response.
 */
var getArtists = APIServer.prototype.getArtists = function(req,res){

	res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
	
	var artists = [];
	
	db.each('SELECT DISTINCT artist FROM albums ORDER BY artist',function(err,row){
	
		if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
		
		if ( row ) artists.push(row.artist);
	
	},function(){
		
		res.end(JSON.stringify(artists));
		
	});

}

/**
 * getAlbums
 * @description Creates a response to a request for all albums.
 * @object req - the request.
 * @object res - the response.
 */
var getAlbums = APIServer.prototype.getAlbums = function(req,res){

	res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
	
	var albums = [];
	
	db.each('SELECT * FROM albums',function(err,row){
	
		if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
		
		if ( row ) albums.push(row);
	
	},function(){
		
		res.end(JSON.stringify(albums));
		
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
var getTracks = APIServer.prototype.getTracks = function(req,res){
	
	res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
	
	var tracks = [];
	
	db.each('SELECT hash, title, album, trackno FROM tracks',function(err,row){
	
		if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
		
		if ( row ) tracks.push(row);
	
	},function(){
		
		res.end(JSON.stringify(tracks));
		
	});
	
}

/**
 * getAlbumTracksByHash
 * @description Creates a response to a request for the tracks in an album.
 * @object req - the request.
 * @object res - the response.
 * @string hash - the album unique hash.
 */
var getAlbumTracksByHash = APIServer.prototype.getAlbumTracksByHash = function(req,res,hash){

	res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
	
	var tracks = [];
	
	db.each('SELECT tracks.* FROM albums INNER JOIN tracks WHERE albums.hash=?',{ 1 : hash },function(err,row){
	
		if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
		
		if ( row ) tracks.push(row);
	
	},function(){
		
		res.end(JSON.stringify(tracks));
		
	});

}

/**
 * getArtistsAlbums
 * @description Creates a response to a request for a request for all albums by an artist.
 * @object req - the request.
 * @object res - the response.
 * @string artist - the name of the artist to list albums for.
 */
var getArtistsAlbums = APIServer.prototype.getArtistsAlbums = function(req,res,artist){
	
	artist = decodeURIComponent(artist);
	
	res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
	
	var albums = [];
	
	db.each('SELECT * FROM albums WHERE artist=?',{ 1 : artist },function(err,row){
	
		if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
		
		if ( row ) albums.push(row);
	
	},function(){
		
		res.end(JSON.stringify(albums));
		
	});
	
}

/**
 * updateCollection
 * @description Updates the collection. Responds with the shouldIScan decision.
 * @object req - the request.
 * @object res - the response.
 */
var updateCollection = APIServer.prototype.updateCollection = function(req,res){

	res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});

	// check if there are changes.
	scanner.shouldIScan(function(iShouldScan){
	
		res.end(JSON.stringify({iShouldScan : iShouldScan}));
	
	});

}

/**
 * stream
 * @description Returns the stream for a track corresponding to a hash.
 * @object req - the request.
 * @object res - the response.
 * @string hash - the track hash.
 */
var stream = APIServer.prototype.stream = function(req,res,hash){

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

/**
 * info
 * @description Responds with information on a particular API root.
 * @object req - the request.
 * @object res - the response.
 */
var info = APIServer.prototype.info = function(req,res){

	res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});	

	switch (req.url) {
		
		case "/":
		
			res.end(JSON.stringify({
			
				header: "MusicMe API",
				
				body: "The API provides four main methods: collection (for querying artists, albums and tracks), settings (for reading and writing settings.), stream (for streaming tracks), and identity(for managing accounts.)",
				
				examples: ["/collection","/settings","/stream","/identity"]
			
			}));
		
		break; case "/collection":
		
			res.end(JSON.stringify({
			
				header: "Collection API",
				
				body: "Use the collection API to get information about the collection, including metadata information and scanning progress.",
				
				examples: ["/collection/artists","/collection/albums","/collection/tracks","/collection/artist/:artistname","/collection/artist/:artistname/:albumname","/collection/album/:albumname","/collection/album/:albumname/artist/:artistname","/collection/track/:hash","/collection/track/artist/:artistname/album/:albumname/trackno/:trackno","/collection/status"]
			
			}));
		
		break; case "/stream":
		
			res.end(JSON.stringify({
			
				header: "Stream API",
				
				body: "Stream API allows streaming of music.",
				
				examples: ["/stream/:hash"]
				
			}));
		break; default:
		
			res.end();
	}

}

module.exports = APIServer;