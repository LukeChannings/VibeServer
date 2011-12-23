// require dependencies.
var walk = require("walk");
var musicmetadata = require("musicmetadata");
var fs = require("fs");
var crypto = require("crypto");

/**
 * Scanner Class
 * @description Constructor for the scanner.
 * @string path - Collection path.
 * @object coreScope - Scope of the core class. (Or whichever class has the database socket.)
 */
function Scanner(path,coreScope){

	if ( path )	this.path = path;
	else throw "Scanner instantiated without a path!";
	
	// set the core scope.
	this.coreScope = ( coreScope ) ? coreScope : this;
	
	// make a cache object. (So we don't have to do everything again...)
	this.cache = {};
	
}

/**
 * walkCollection
 * @description Walks a given path and returns an array of files within.
 * @string path - Path to be walked.
 * @function callback - Function to be called once the directory has been walked.
 * @bool allowAnyFile - Return a list of ALL files within a directory, not just audio formats.
 */
var walkCollection = Scanner.prototype.walkCollection = function(path, callback, allowAnyFile){
	
	// Make sure there is a path.
	if ( !path ) throw "walkCollection was called without a path!";
	
	// Make sure there is a callback.
	else if ( typeof callback !== "function" ) throw "walkCollection called without a callback!";

	// Make a walker.
	var walker = walk.walk(path);
	
	// Array for song paths.
	var songs = [];
	
	// Check each file.
	walker.on('file',function checkFile(path,stat,next){
		
		// Check for an audio file.
		if ( /\.(mp(3|4)|aac|wav|flac|ogg)$/.test(stat.name) && !allowAnyFile ){
			
			// Push the song path to the song array.
			songs.push(path + '/' + stat.name);
		
		}
		
		// Read next file.
		next();
		
	});
	
	// When the walking has finished:
	walker.on('end',function EOF(){
		
		// Execute the callback and pass it the songs array.
		callback(songs);
		
		// Destroy self.
		walker = songs = null;
		
	});
	
}

/**
 * getMetadata
 * @description Get metadata object for a given path.
 * @string path - File to get the metadata for.
 * @function callback - Function executed when metadata is fetched.
 * @function next (optional) - Called when parsing has finished. (Supports synchronous metadata fetching.)
 */
var getMetadata = Scanner.prototype.getMetadata = function(path, callback, next){
	
	// make a new metadata parser.
	var parser = new musicmetadata(fs.createReadStream(path));
	
	// when metadata is fetched,
	parser.on('metadata',function(metadata){
		
		// pass it to the callback.
		callback(metadata);
		
	});
	
	// when the parsing is all done:
	parser.on('done',function(err){
		
		// check for errors,
		if ( err ) console.log(err);
		
		// clear the parser,
		parser = null;
		
		// call next, if it exists.
		if (  typeof next == "function" ) next();
		
	});

}

/**
 * getMetadataAll
 * @description Get metadata for an array of files. (Synchronous.)
 * @array paths - Array of paths to get the metadata for.
 * @function callback - Called for each path in the array.
 * @function done (optional) - Called when all metadata has been fetched.
 */
var getMetadataAll = Scanner.prototype.getMetadataAll = function(paths, callback, done){
	
	(function iterate(i){
		
		// if we've run out of paths.
		if ( (paths.length) === i )
		{
			// we're all done.
			if ( typeof done == "function" ) done();
		}
		else
		{
			// get metadata for the present path.
			getMetadata(paths[i],function(metadata){
				
				// pass the metadata object, the file path and the index to the callback.
				callback(metadata,paths[i],i);
				
			},function(){
				
				// once the current path has been handled, move to the next.
				iterate(i + 1);
				
			});
		}
		
	})(0);
	
}

/**
 * shouldIScan
 * @description Compares the stored collection checksum with a newly generated collection 
 				checksum to determine if the collection has been changed.
 * @string path - the path to the collection.
 * @function callback - function to execute after we've decided. (depending on the collection, it could be a while.)
 */
var shouldIScan = Scanner.prototype.shouldIScan = function(callback){
	
	if ( !callback) throw "Missing callback, fool!";
	
	var self = this;
	
	// We need to walk the collection to get a list of files...
	walkCollection(self.path, function(files){
	
		// ...which we then join and create a checksum of,
		var checksum = crypto.createHash('md5').update(files.join('')).digest("hex");
		
		// and if the checksum matches the stored checksum, then nothing's changed.
		var decision = ( self.coreScope.collection_checksum === checksum ) ? false : true;
		
		// Cache the results.
		self.cache.checksum = checksum;
		self.cache.walk = files;
		
		// make it known that this function has been run.
		self.shouldIScanHasBeenRun = true;
		self.shouldIScanDecision = decision;
		
		// We'll call back with our decision.
		callback(decision);
	
	});
}

/**
 * scan
 * @description Scans a directory for audio files and adds each file's metadata to the database.
 * @string path - Directory to scan.
 * @function callback (optional) - executed once the collection has finished scanning.
 */
var scan = Scanner.prototype.scan = function(callback){
	
	var self = this;
	
	// truncate.
	self.coreScope.truncateCollection.call(self.coreScope);
	
	// handle the metadata
	function handleMetadata(metadata,path,index){
	
		if ( self.coreScope.verbose ) console.log("Scanning " + index + " of " + (self.walkFileCount || self.cache.walk.length));
	
		// add the track to the collection.
		self.coreScope.addTrackToCollection.apply(self.coreScope,[metadata,path]);
		
	}
	
	// function to run when all the metadata has been fetched and added to the collection.
	function end(){
		
		// update the collection checksum.
		self.coreScope.updateCollectionChecksum(self.cache.checksum || self.checksum);
		
		// run the callback if there is one.
		if ( typeof callback === "function" ) callback();
		
		if ( self.coreScope.verbose ) console.log("All done.");
		
	}
	
	if ( this.shouldIScanHasBeenRun ){
	
		getMetadataAll(self.cache.walk,handleMetadata,end);
	
	}
	else{
		
		walkCollection(self.path,function(walk){
			
			self.checksum = crypto.createHash('md5').update(walk.join('')).digest("hex");
			
			self.walkFileCount = walk.length;
			
			getMetadataAll(walk,handleMetadata,end);
			
		});
		
	}

}

// export myself.
module.exports = Scanner;