var fs = require('fs');
var crypto = require('crypto');

/**
 * Scanner
 * @description Scans the collection.
 */
function Scanner(callback){

	// public stats.
	this.scanningState = "NOT_SCANNING";

	this.itemsToAdd = 0;
	this.itemsAdded = 0;

	this.itemsToDel = 0;
	this.itemsDeleted = 0;

	// usual nonsense.
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
		if ( state == "SCAN_ADD" && no && of && path )
		{
			// log the percent of tracks scanned and the path of the current item being scanned.
			console.log("Added " + no + ' of ' + of + ' - ' + path);
			
			// set the indexes.
			self.itemsToAdd = of;
			self.itemsScanned = no;
			
		}
		else if ( state == "SCAN_DEL" && no && of && path )
		{
			console.log("Removed: " + no + " of " + of + " - " + path);
			
			// set the indexes.
			self.itemsToDel = of;
			self.itemsDeleted = no;
			
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
	 * @description returns a list of all mp3 and ogg files in a specified directory.
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
		
			if ( err  )
			{
				setState("SCAN_FAIL");
				
				throw "Path : " + path + " does not exist.";
				
			}
		
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
				
					// if the file is an MP3 or OGG.
					if ( /\.(mp3|ogg)$/.test(file) )
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
	
		// set new scanning state.
		setState("SCAN_WALK");
	
		// walk the path.
		walk(path,function(err,result){
			
			// if there was an error walking then throw it.
			if ( err ) throw err;
			
			// create a hash for the results.
			var checksum = crypto.createHash('md5').update(result.join()).digest('hex');

			// if the hashes match.
			if ( settings.get('collectionChecksum') == checksum )
			{
				// set new scanning state.
				setState("NO_SCAN");
				
				// nothing to do here.
				console.log("Collection is up-to-date.");
			}
			else
			{
				// if there is a previous checksum. (but it doesn't match the new one.)
				if ( settings.get('collectionChecksum') )
				{
					// set new scanning state. (something has changed.)
					setState("SCAN_DIFF");
					
					// get a list of previous tracks.
					event.emit('queryCollection','SELECT path FROM track',function(err,res){
					
						// initialise an array to put the paths into.
						var collectionPaths = [];
						
						// loop through the result.
						for ( var i = 0; i < res.length; i++ )
						{
							// add the paths to the array.
							collectionPaths.push(decodeURIComponent(res[i].path));
						}
						
						var diff = collectionDifference(collectionPaths, result);
						
						// set no scan state.
						setState("SCAN_DEL");
						
						// loop through tracks to remove.
						(function removeTracks(i){
						
							// there are no more tracks to remove
							if ( ! diff[0][i] )
							{
								// set no scan state.
								setState("SCAN_ADD");
								
								// there are tracks to add.
								if ( diff[1].length !== 0 )
								{ 
									// add tracks.
									addTracks(0);
								}
								
								// there are no tracks to add.
								else
								{
								
									// set new checksum.
									settings.set('collectionChecksum',checksum);
								
									// set new scan state.
									setState("NO_SCAN");
								}
							}
							else
							{
								// remove the track from the collection
								event.emit('removeTrackFromCollection',diff[0][i],function(){
								
									setState("SCAN_DEL",i,diff[0].length);
								
									// when we're done move on to the next track to remove.
									removeTracks(++i);
								
								});
								
							}
						
						})(0);
						
						// add new tracks to the collection.
						function addTracks(i){
							
							// there are no more tracks to add
							if ( ! diff[1][i] )
							{
								// set no scan state.
								setState("NO_SCAN");
								
								// call it quits.
								return;
							}
							
							// there are tracks to add.
							else
							{
								// add the current track.
								event.emit('addTrackToCollection',diff[1][i],function(){
								
									// set a new scan state.
									setState("SCAN_ADD",i,diff[1].length,diff[1][i]);
								
									// set new checksum.
									settings.set('collectionChecksum',checksum);
								
									// when that track has been added read the next track.
									addTracks(++i);
								
								});
								
							}
						}
						
					});
					
				}
				
				// if there is no previous checksum then do a first-run scan.
				else
				{
				
					// set new scanning state.
					setState("SCAN_ADD");
				
					// loop through tracks.
					(function next(i){
					
						// there are no more tracks.
						if ( ! result[i] )
						{
							// save the checksum. (so we don't scan again.)
							settings.set('collectionChecksum',checksum);
						
							// set a new scanning state.
							setState("POST_SCAN");
						
							// do post scan.
							event.emit('postScan',function(){
							
								// set finished scanning.
								setState("NO_SCAN");
							
								// log it.
								console.log("Scanning finished.");
							
							});
						
						}
						else
						{
							// set a new index.
							setState("SCAN_ADD",i,result.length,result[i]);
						
							// add the current track to the collection.
							event.emit('addTrackToCollection',result[i],function(){
							
								// when that track has been added, read the next one.
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