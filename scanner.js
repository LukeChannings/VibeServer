var fs = require('fs');
var crypto = require('crypto');

/**
 * Scanner
 * @description Scans the collection.
 */
function Scanner(callback){

	// public stats.
	this.scanningState = "NOT_SCANNING";
	this.itemsToScan = 0;
	this.itemsScanned = 0;

	var self = this;

	function setState(state,no,of){
		
		self.scanningState = state;
		
		if ( state == "FETCHING_METADATA" && no && of )
		{
			console.log("Scanned " + Math.floor((no/of)*100) + "% (" + no + '/' + of + ')');
			
			self.itemsToScan = of;
			self.itemsScanned = no;
			
		}
		else{
			console.log("Scanner status changed: " + state + ".");
		}
	}

	/**
	 * walk
	 * @description synchronous walk.
	 */
	function walk(path,callback){
		
		var result = walkSync(path);
		
		callback(result);
		
	}
	
	/**
	 * walkSync
	 * @description synchronous walk.
	 */
	function walkSync(path){
	
		var songs = [];
		
		var files = fs.readdirSync(path);
		
		for ( var i = 0; i < files.length; i++ )
		{
			var stat = fs.statSync(path + '/' + files[i]);
			
			if ( stat.isFile() && /(mp3|ogg|aac)$/.test(files[i]) )
			{
				songs.push(path + '/' + files[i]);
			}
			else if ( stat.isDirectory() )
			{
			
				var subfiles = walkSync(path + '/' + files[i]);
			
				for ( var j = 0; j < subfiles.length; j++ )
				{
					songs.push(subfiles[j]);
				}
			}
		}
		
		return songs;
	
	}

	function collectionDifference(){}

	this.scan = function(){
	
		setState("WALKING");
	
		var path = settings.get('collectionPath');
	
		walk(path,function(songs){
		
			setState("FETCHING_METADATA");
		
			// generate a checksum.
			var checksum = crypto.createHash('md5').update(songs.join('')).digest("hex");
		
			// get the last checksum.
			var collectionChecksum = settings.get('collectionChecksum');
		
			if ( checksum !== collectionChecksum )
			{
			
				settings.set('collectionChecksum',checksum);
			
				(function loopThroughSongs(i){
				
					setState("FETCHING_METADATA",i,songs.length);
				
					if ( i < songs.length )
					{
						event.emit('addTrackToCollection',songs[i],function(){
						
							loopThroughSongs(i + 1);
						
						});
					}
					else
					{
						setState("NOT_SCANNING");
					}
				
				})(0);
			
			}
			else
			{
				setState("NOT_SCANNING");
				console.log("The collection is up-to-date.");
			}
			
			
		});
	
	}
	
	if ( callback ) callback.call(this);
	
}

// Export the scanner class.
module.exports = Scanner;