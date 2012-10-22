/**
 * finds all music files in a given directory.
 * @param directories {String|Array} path to the music directory.
 * @param mimeTypes {Array} acceptible music MIME types, default is only audio/mpeg. 
 * @return {Array} paths to found music files.
 */
define(function() {

	// dependencies.
	var mime = require("mime")
	  , walk = require("walk")

	// locals.
	var mimeTypes = ["audio/mpeg", "audio/aac", "audio/mp4", "audio/wave"]
	  , walker

	return function(directories, _mimeTypes, callback) {

		// set a list of mime types to check for.
		mimeTypes = _mimeTypes instanceof Array ? _mimeTypes : mimeTypes

		// make certain the directories 
		directories = directories instanceof Array ? directories : [directories]

		directories.forEach(function(directory) {

			var files = []

			// set up a walker.
			walker = walk.walk(directory, {
				followLinks : false
			})

			// handle files found in the walking directory.
			walker.on("file", function(root, stat, next) {

				if ( mimeTypes.indexOf(mime.lookup(root + "/" + stat.name)) !== -1 ) {
					files.push(root + "/" + stat.name)
				}

				next()
			})

			walker.on("end", function() {

				callback && callback(files)
			})
		})
		
	}
})