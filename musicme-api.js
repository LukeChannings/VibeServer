var http = require("http");
var router = require('choreographer').router();

/**
 * MusicMe Server API
 * @description MusicMe HTTP Server.
 */
function APIServer(coreScope,scannerScope){
	
	// can't keep typing the long version, I'm too lazy for that.
	var db = coreScope.db;
	

	router.get('/track/*',function(req, res, hash){
	
		res.writeHead(200, {'Content-Type': 'text/plain'});
		
		db.get('SELECT * FROM tracks WHERE hash=?',{1:hash},function(err,row){
			
			if ( !err ) res.end(JSON.stringify(row));
			
		});
		
	}).get('/tracks',function(req,res){
	
		res.writeHead(200, {'Content-Type':'text/plain'});
		
		var tracks = [];
		
		db.each('SELECT * FROM tracks',function(err,data){
		
			if ( !err ) tracks.push(data);
		
		},function(){
		
			res.end(JSON.stringify(tracks));
		
		});
	
	});
	
	// run the server.
	http.createServer(router).listen(coreScope.api_port);
	
	// tell people that the server is running.
	console.log("API running on port " + coreScope.api_port + ".");
	
}

module.exports = APIServer;