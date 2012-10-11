// export the module where requirejs isn't being used.
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function() {

	var request = require("request"),
		lastfmApiKey = "6d97a6df16c5510dcd504956a0c6edb0",
		lastfmApiBaseUri = "http://ws.audioscrobbler.com/2.0/?format=json"

	/**
	 * takes a metadata object with properties artist and album and returns the object 
	 * with an additional albumart property containing URIs for lastfm album art.
	 * @param metadata {Object} object containing metadata for a song, with at least the artist and album properties valid.
	 * @param callback {Function} 
	 */
	function getAlbumArt( metadata, callback ) {

		request(

			// request URI.
			lastfmApiBaseUri + "&api_key=" + lastfmApiKey + "&method=album.getinfo&artist=" + metadata.artist + "&album=" + metadata.album,

			// callback to handle the results.
			function(err, res, body) {
		
				// if an error occurs, try to continue.
				if ( err ) {

					callback( null, null )

					return
				}

				// parse the results.
				var body = JSON.parse( body ),
					result
					
				try {
					result = {
						"small" : body.album.image[0]["#text"],
						"medium" : body.album.image[1]["#text"],
						"large" : body.album.image[2]["#text"],
						"extralarge" : body.album.image[3]["#text"],
						"mega" : body.album.image[4]["#text"]
					}
				}
				catch (ex) {
					result = null;
				}
				finally {

					metadata.albumart = result

					callback( null, metadata )
				}
			}
		)
	}

	return {
		getAlbumArt : getAlbumArt
	}
})