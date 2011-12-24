var http = require('http');
var router = require('choreographer').router();
var fs = require('fs');

/**
 * MusicMe Server API
 * @description MusicMe HTTP Server.
 */
function APIServer(coreScope,scannerScope){
	
	// can't keep typing the long version, I'm too lazy for that.
	var db = coreScope.db;
	
	router.get('/',function(req,res){
	
		res.writeHead(200, {'Content-Type': 'text/plain','Access-Control-Allow-Origin':'*'});		
		res.end(JSON.stringify({
			header: "MusicMe API",
			body: "The API provides four main methods: collection (for querying artists, albums and tracks), settings (for reading and writing settings.), stream (for streaming tracks), and identity(for managing accounts.)",
			examples: ["/collection","/settings","/stream","/identity"]
		}));
	
	}).get('/collection',function(req, res){
	
		res.writeHead(200, {'Content-Type': 'text/plain','Access-Control-Allow-Origin':'*'});		
		res.end(JSON.stringify({
			header: "Collection API",
			body: "Use the collection API to get information about the collection, including metadata information and scanning progress.",
			examples: ["/collection/artists","/collection/albums","/collection/tracks","/collection/artist/:artistname","/collection/artist/:artistname/:albumname","/collection/album/:albumname","/collection/album/:albumname/artist/:artistname","/collection/track/:hash","/collection/track/artist/:artistname/album/:albumname/trackno/:trackno","/collection/status"]
		}));
		
	}).get('/collection/artists',function(req,res){
		
		res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
		
		var artists = [];
		
		db.each('SELECT DISTINCT artist FROM albums',function(err,row){
		
			if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
			
			if ( row ) artists.push(row.artist);
		
		},function(){
			
			res.end(JSON.stringify(artists));
			
		});
		
	}).get('/collection/albums',function(req,res){
		
		res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
		
		var albums = [];
		
		db.each('SELECT * FROM albums',function(err,row){
		
			if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
			
			if ( row ) albums.push(row);
		
		},function(){
			
			res.end(JSON.stringify(albums));
			
		});
		
	}).get('/collection/album/*',function(req,res,hash){
	
		res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
		
		var tracks = [];
		
		db.each('SELECT tracks.* FROM albums INNER JOIN tracks WHERE albums.hash=?',{ 1 : hash },function(err,row){
		
			if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
			
			if ( row ) tracks.push(row);
		
		},function(){
			
			res.end(JSON.stringify(tracks));
			
		});
	
	}).get('/collection/albums/*',function(req,res,artist){
		
		res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
		
		var albums = [];
		
		db.each('SELECT * FROM albums WHERE artist=?',{ 1 : artist },function(err,row){
		
			if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
			
			if ( row ) albums.push(row);
		
		},function(){
			
			res.end(JSON.stringify(albums));
			
		});
		
	}).get('/collection/tracks',function(req,res){
	
		res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
		
		var tracks = [];
		
		db.each('SELECT * FROM tracks',function(err,row){
		
			if ( err ) console.log(err); // if there was an error on the row, it's not THAT big of a deal.. we can continue.
			
			if ( row ) tracks.push(row);
		
		},function(){
			
			res.end(JSON.stringify(tracks));
			
		});
	
	}).get('/stream',function(req, res){
	
		res.writeHead(200, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
				
		res.end(JSON.stringify({
			header: "Stream API",
			body: "Stream API allows streaming of music.",
			examples: ["/stream/:hash"]
		}));
		
	}).get('/stream/*',function(req,res,hash){
		
		db.get('SELECT path FROM tracks WHERE hash=?',{ 1 : hash },function(err,row){
			
			if ( err )
			{
				res.writeHead(404, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
				res.end(JSON.stringify(err));
			}
			else{
				
				fs.readFile(coreScope.collection_path + row.path,function(err,data){
					
					if ( err )
					{
						res.writeHead(404, {'Content-Type': 'application/json','Access-Control-Allow-Origin':'*'});
						res.end(JSON.stringify(err));
					}
					else{
					
						res.writeHead(200,{'Content-Type':'audio/mpeg'});
						res.end(data);
					}
					
				});
				
			}
		});
		
	});
	
	// run the server.
	http.createServer(router).listen(coreScope.api_port);
	
	// tell people that the server is running.
	console.log("API running on port " + coreScope.api_port + ".");
	
}

module.exports = APIServer;