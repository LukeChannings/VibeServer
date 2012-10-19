/**
 * Vibe Server
 * @description provides Api for use with a Vibe Client.
 * @author Luke Channings
 * @copyright 2012, All Rights Reserved.
 */

// find some music.
require("./src/fs.musicFinder.js") (

	// directories containing music.
	[
		"./TestMusic/"
	],

	// mime types to search for. (defaults to audio/mpeg if null.)
	null,

	// callback to handle music files found in the directories.
	function(files) {

		require("./src/fs.metadata.js").pathsToMetadata (
			
			files,

			function( metadata ) {

				console.log(metadata)

			},
			
			{
				getAlbumArt : true
			}
		)
	}
)