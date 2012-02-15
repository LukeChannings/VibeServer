var http = require("http");
/**
 * Server
 * @description Socket.io server.
 */
function Server(){

	console.log("Server started and listening on " + settings.get('port'));

	http.createServer(function(req,res){
		
		event.emit('listArtists',function(artists){
		
			console.log(artists);
		
		});
		
		res.end("Hello World.");
		
	}).listen(settings.get('port'));
	
}

module.exports = Server;