/**
 * contains mongoose schemas.
 */
define(['crypto'], function( crypto ) {

	/**
	 * ensures the output is a number given a possible 'n/n' input.
	 * @param value {String|Number} the value being set.
	 */
	function numberOfToNumber(value) {

		if ( typeof value !== 'number' && value.indexOf('/') !== -1 ) {

			return parseInt(value.split('/')[0])
		} else if (  typeof value === 'number' ) {

			return value
		} else {

			return 0
		}
	}

	return function( Schema ) {

		this.Track = new Schema({
			  title : { type : String, default : "Unknown Title" }
			, artist : { type : String, default : "Unknown Artist" }
			, album : { type : String, default : "Unknown Album" }
			, albumArtist : { type : String, default : "Unknown Artist" }
			, track : { type : Number, default : 0, set : numberOfToNumber }
			, genre : String
			, year : { type : Number, default : 0000 }
			, mime : String
			, bitRate : Number
			, duration : Number
			, size : Number
			, albumArt : {}
			, path : String
		})

		this.Playlist = new Schema({
			  name : String
			, tracks : [this.Track]
		})

		this.Collection = new Schema({
			  path : String
			, tracks : [this.Track]
			, checksum : String
		})

		this.User = new Schema({
			  name : String
			, digest : String
			, properties : {}
			, collections : [this.Collection]
			, playlists : [this.Playlist]
		})

		this.Setting = new Schema({
			  key : String
			, value : String
		})

		return this
	}
})