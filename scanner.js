var fs = require('fs');

/**
 * Scanner
 * @description Scans the collection.
 */
function Scanner(callback){

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

	this.scan = function(){}
	
}

// Export the scanner class.
module.exports = Scanner;