function API(){

	function Track(){}
	function Album(){}
	function Artist(){}
	
	event.on('listArtists',function(callback){
	
		event.emit('queryCollectionAll','SELECT name FROM artist',function(err,res){
		
			if (err) throw err;
		
			var artists = [];
			
			for ( var i = 0; i < res.length; i++ )
			{
				artists.push(res[i].name);
			}
			
			callback(artists);
		
		});
	
	});

}

module.exports = API;