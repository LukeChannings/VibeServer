// export the module where requirejs isn't being used.
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function() {

	var taglib = require("taglib"),
		async = require("async"),
		lastfm = require("./api.lastfm.js")

	/**
	 * fetches metadata for each music file.
	 * @param files {Array} list of paths to music files.
	 * @return {Array} array of objects containing metadata for music files.
	 */
	function pathsToMetadata( files, callback, options ) {

		options = options || {}

		var metadata = [],
			count = 0

		async.map(

			files,

			taglib.read,

			function(err, _metadata) {

				if ( options.getAlbumArt ) {

					async.map(

						_metadata,

						lastfm.getAlbumArt,

						function( err, metadata ) {

							callback(metadata)
						}
					)
				} else {

					callback(_metadata)
				}
			}
		)
	}

	return {
		pathsToMetadata : pathsToMetadata
	}
})