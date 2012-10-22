define(["node-ffprobe", "async", "api.lastfm"], function(probe, async, lastfm) {

	/**
	 * fetches metadata for a list of files..
	 * @param files {Array} list of paths to music files.
	 * @param callback {Function} called when fetching has completed.
	 * @return {Array} array of objects containing metadata for music files.
	 */
	var pathsToMetadata = function( files, callback, options ) {

		// locals
		var options = options || {}
		  , metadata = []
		  , count = 0

		async.mapSeries(

			files,

			probe,

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

	return { pathsToMetadata : pathsToMetadata }
})