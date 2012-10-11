/**
 * finds all music files in a given directory.
 * @param directories {String|Array} path to the music directory.
 * @param mimeTypes {Array} acceptible music MIME types, default is only audio/mpeg. 
 * @return {Array} paths to found music files.
 */

// export the module where requirejs isn't being used.
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function() {

	var mime = require("mime"),
		walk = require("walk"),
		walker,
		mimeTypes = ["audio/mpeg"]

	return function(directories, _mimeTypes, callback) {

		// set a list of mime types to check for.
		mimeTypes = _mimeTypes instanceof Array ? _mimeTypes : mimeTypes

		directories = directories instanceof Array ? directories : [directories]

		directories.forEach(function(directory) {

			var files = []

			// set up a walker.
			walker = walk.walk(directory, {
				followLinks : false
			})

			// handle files found in the walking directory.
			walker.on("file", function(root, fileStats, next) {

				if ( mimeTypes.indexOf(mime.lookup(root + "/" + fileStats.name)) !== -1 ) {
					files.push(root + "/" + fileStats.name)
				}

				next()
			})

			walker.on("end", function() {

				callback(files)
			})
		})
		
	}
})