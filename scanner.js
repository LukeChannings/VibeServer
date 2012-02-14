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

	/**
	 * setState
	 * @description updates the scanner state and alerts when a change happens.
	 * @param state - a new state (string.)
	 * @param no - the index of the item being scanned. (ADDING_TRACK only.)
	 * @param of - the total number of items to be scanned. (ADDING_TRACK only.)
	 * @param path - the path of the item being scanned. (ADDING_TRACK only.)
	 */
	function setState(state,no,of,path){
		
		// set the new state.
		self.scanningState = state;
		
		// if we're adding a track.
		if ( state == "ADDING_TRACK" && no && of && path )
		{
			// log the percent of tracks scanned and the path of the current item being scanned.
			console.log("Scanned " + Math.floor((no/of)*100) + "% (" + no + '/' + of + ') - ' + path);
			
			// set the indexes.
			self.itemsToScan = of;
			self.itemsScanned = no;
			
		}
		else{
			
			// initialise indexes to zero.
			self.itemsToScan = self.itemsScanned = 0;
			
			// log the state change.
			console.log("Scanner status changed: " + state + ".");
		}
	}

	/**
	 * walk
	 * @description returns a list of all mp3, ogg, m4a and flac files in a specified directory.
	 * @param path - path to search (string.)
	 * @param done - callback to be executed when walking has completed. (function.)
	 */
	function walk(path, done) {

		// if there is no path or done function then throw an error.
		if ( !path || !done ) throw "walk: missing parameters.";
		
		// initialise an array to store the results in.
		var result = [];
		
		// list the files in the path.
		fs.readdir(path,function(err,list){
		
			// loop through the files in the path.
			(function next(i){
			
				// if there are no more files to loop.
				if ( ! list[i] )
				{
					// send the results to the callback.
					done(null,result);
					
					// prevent the function from continuing.
					return;
				}
				
				// create a variable to contain the full path to the current file.
				var file = path + '/' + list[i];
				
				// get the stats for the current file.
				fs.stat(file,function(err,stat){
				
					// if the file is a song
					if ( /\.(mp3|ogg|m4a|flac)$/.test(file) )
					{
					
						// add the file to the results.
						result.push(file);
						
						// read the next file.
						next(++i);
						
					}
					
					// if the current file is a directory.
					else if ( stat.isDirectory() )
					{
						// run this function on that directory.
						walk(file,function(err,list){
							
							// if there was an error then throw it.
							if ( err ) throw err;
							
							// concatenate the previous results with the subdirectory results.
							result = result.concat(list);
							
							// read the next file.
							next(++i);
							
						});
					}
					
					// if the file is neither a song or a directory then read the next file.
					else next(++i);
				
				});
			
			})(0);
		
		});

	}

	/**
	 * collectionDifference
	 * @description returns the files that have been added or removed from an array.
	 * @param A - the first array
	 * @param B - the second array
	 */
	function collectionDifference(A,B){
	
		// find the files that are not in the second array that are in the first.
		var removed = A.filter(function(item){
		
			// if the current item in A is not in B
			if ( B.indexOf(item) === -1 )
			{
				// add the item to the new array.
				return 1;
			}
			else
			{
				// otherwise do not.
				return 0;
			}
		
		});
		
		// find the files that are in the second array that are not in the first.
		var added = B.filter(function(item){
		
			// if the current item in array B is not in array A
			if ( A.indexOf(item) === -1 )
			{
				// add it to the new array.
				return 1;
			}
			else
			{
				// otherwise do not.
				return 0;
			}
		
		});
	
		// return an array with the two arrays.
		return [removed, added];
	
	}

	/**
	 * scan
	 * @description Scans the collection path.
	 * @param callback - executed when scanning has completed. (function)
	 */
	this.scan = function(callback){
	
		// get the collection path.
		var path = settings.get('collectionPath');
	
		// if there is no path
		if ( ! path )
		{
			// send the error to the callback, if there is one specified.
			if (callback) callback("NO PATH");
			
			// stop the function from continuing.
			return;
		}
	
		// walk the path.
		walk(path,function(err,result){
			
			// if there was an error walking then throw it.
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
					// get a list of previous tracks.
					event.emit('queryCollectionAll','SELECT path FROM track',function(err,res){
					
						console.log(res);
					
					});
					
				}
				
				// if there is no previous checksum then do a first-run scan.
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
						
							setState("ADDING_TRACK",i,result.length);
						
							event.emit('addTrackToCollection',result[i],function(){
							
								next(++i);
							
							});
						
						}
						
					})(0);
				}
			}
			
		});
		
	}
	
	// execute the callback within the scanner scope.
	if ( callback ) callback.call(this);
	
}

// Export the scanner class.
module.exports = Scanner;