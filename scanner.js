var fs = require('fs');
var crypto = require('crypto');
var match = require('match-files');
var async = require('async');

/**
 * Scanner
 * @description Scans the collection.
 */
function Scanner(callback){

	// public stats.
	this.scanning = {
		"state" : "NO_SCAN",
		"items" : {
			"del" : {
				"no" : 0,
				"of" : 0
			},
			"add" : {
				"no" : 0,
				"of" : 0
			}
		}
	}

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
			console.log("Adding " + no + ' of ' + of + ' - ' + path);
			
		}
		else if ( state == "SCAN_DEL" && no && of && path )
		{
			console.log("Removing: " + no + " of " + of + " - " + path);
			
		}
		else{
	
			// log the state change.
			console.log("Scanner status changed: " + state + ".");
		}
	}

	/**
	 * flattenArray
	 * @description converts an array of objects with a single property into an array of strings.
	 */
	function flattenArray(A){
	
		// make an array to put the result into.
		var result = [];
	
		// loop through the properties of A.
		for ( var i = 0; i < A.length; i++ )
		{
		
			for ( var j in A[i] )
			{
				result.push(A[i][j]);
			}
		
		}
	
		// return the resulting array.
		return result;
	
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
	
		// function to match MP3 files.
		function matchMP3(path){ return path.match(/\.mp3$/) }
	
		// walk the collection.
		match.find(settings.get('collection_path'),{ fileFilters : [matchMP3] },function(err, paths){
		
			// calculate the checksum of the current collection.
			var checksum = crypto.createHash('md5').update(paths.join('')).digest("hex");
		
			// compare the current checksum to the checksum of the last scanned collection.
			if ( checksum == settings.get('collection_checksum') )
			{
				// set scanner state to no-scan.
				setState("NO_SCAN");
			}
			else
			{
				
				// set scanner state to scanning difference.
				setState("SCAN_DIFF");
				
				// get the last scanned collection paths.
				event.emit('queryCollection','SELECT path FROM track',function(err,previous_collection){
				
					// get the differences between the previous and current collections.
					var diff = collectionDifference(flattenArray(previous_collection),paths);
				
					// update scanning stats.
					self.scanning.items.del.of = diff[0].length;
					self.scanning.items.add.of = diff[1].length;
					
					setState("SCAN_ADD");
					
					// add tracks to the collection.
					async.forEachSeries(diff[1],function(song,next){
					
						event.emit('addTrackToCollection',song,function(){
						
							// update the scanning index.
							self.scanning.items.add.no++;
							
							// update the scanning state.
							setState("SCAN_ADD",self.scanning.items.add.no,self.scanning.items.add.of,song);
						
							process.nextTick(next);
						
						});
					
					},function(){
					
						settings.set('collection_checksum',checksum);
					
						// set adding stats to zero.
						self.scanning.items.add.of = self.scanning.items.add.no = 0;
						
						if ( self.scanning.items.del.of !== 0 )
						{
							setState("SCAN_DEL");
						}
						
						async.forEachSeries(diff[0],function(song,next){
						
							event.emit('removeTrackFromCollection',song,function(){
							
								// update the scanning index.
								self.scanning.items.del.no++;
								
								// update scanning state.
								setState("SCAN_DEL",self.scanning.items.del.no,self.scanning.items.del.of,song);
							
							});
						
						},function(){
						
							// set deleting stats to zero.
							self.scanning.items.del.of = self.scanning.items.del.no = 0;
						
							setState("POST_SCAN")
						
							event.emit('postScan',function(){
							
								setState("NO_SCAN");
							
							});
						
						});
					
					});
				
				});
				
			}
		
		});
		
	}
	
	// run the callback within the scanner scope after init.
	if ( callback ) callback.call(this);
	
	
	// listen for scanningStatus event.
	event.on('scanningStatus',function(callback){
	
		// callback with the scanning object.
		callback(self.scanning);
	
	});
}

// Export the scanner class.
module.exports = Scanner;