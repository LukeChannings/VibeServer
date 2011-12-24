var http = require("http");
var router = require('choreographer').router();

/**
 * MusicMe Server API
 * @description MusicMe HTTP Server.
 */
function APIServer(coreScope,scannerScope){
	
	// can't keep typing the long version, I'm too lazy for that.
	var db = coreScope.db;
	
	// 
	router.get('/showmethemoney',function(req,res){
	
		res.writeHead(200, {'Content-Type': 'text/html'});
		
		db.each("SELECT DISTINCT artist FROM tracks",function(err,row){
			
			if ( !err ) res.write(row.artist + "<br/>");
			
		},function(){
		
			res.end();
		
		});
		
	});
	
	// run the server.
	http.createServer(router).listen(coreScope.api_port);
	
	// tell people that the server is running.
	console.log("API running on port " + coreScope.api_port + ".");
	
}

module.exports = APIServer;