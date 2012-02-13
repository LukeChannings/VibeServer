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

	function setState(state,no,of,path){
		
		self.scanningState = state;
		
		if ( state == "ADDING_TRACK" && no && of )
		{
			console.log("Scanned " + Math.floor((no/of)*100) + "% (" + no + '/' + of + ') - ' + path);
			
			self.itemsToScan = of;
			self.itemsScanned = no;
			
		}
		else{
			console.log("Scanner status changed: " + state + ".");
		}
	}

	/**
	 * walk
	 * @description asynchronous walk.
	 */
	function walk(path, done) {

		if ( !path || !done ) throw "walk: missing parameters.";
		
		var result = [];
		
		fs.readdir(path,function(err,list){
		
			(function next(i){
			
				if ( ! list[i] )
				{
					done(null,result);
					return;
				}
				
				var file = path + '/' + list[i];
				
				fs.stat(file,function(err,stat){
				
					if ( /\.(mp3|ogg|m4a|flac)$/.test(file) )
					{
					
						result.push(file);
						
						next(++i);
						
					}
					else if ( stat.isDirectory() )
					{
						walk(file,function(err,list){
							
							if ( err ) throw err;
							
							result = result.concat(list);
							
							next(++i);
							
						});
					}
					else
					{
						next(++i);
					}
				
				});
			
			})(0);
		
		});

	}

	function collectionDifference(oldPaths,newPaths){
	
		var removed = oldPaths.filter(function(item){ if ( newPaths.indexOf(item) === -1 ) return 1; else return 0 });
		var added = newPaths.filter(function(item){ if ( oldPaths.indexOf(item) === -1 ) return 1; else return 0 });
	
		return [removed, added];
	
	}

	this.scan = function(callback){
	
		walk(settings.get('collectionPath'),function(err,result){
			
			if ( err ) throw err;
			
			// create a hash for the results.
			var checksum = crypto.createHash('md5').update(result.join()).digest('hex');

			// check if the hashes match.
			if ( settings.get('collectionChecksum') == checksum )
			{
				console.log("Collection is up-to-date.");
			}
			else
			{
				// check if there is a previous checksum.
				if ( settings.get('collectionChecksum') )
				{
					event.emit('queryCollection','SELECT path FROM track',function(err,res){
					
						console.log(res);
					
					});
					
				}
				else
				{
					(function next(i){
					
						if ( ! result[i] )
						{
						
							settings.set('collectionChecksum',checksum);
						
							console.log("Fetching metadata finished.");
						
						}
						else
						{
						
							event.emit('addTrackToCollection',result[i],function(){
							
								console.log("Added " + result[i]);
							
								next(++i);
							
							});
						
						}
						
					})(0);
				}
			}
			
		});
		
	}
	
	if ( callback ) callback.call(this);
	
}

// Export the scanner class.
module.exports = Scanner;