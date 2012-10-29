define(['mongoose'], function( mongoose ) {

	var db = mongoose.connect('mongodb://localhost/vibe')
	  , Schema = mongoose.Schema
	  , ObjectId = Schema.ObjectId

	/**
	 * ensures the output is a number given a possible 'n/n' input.
	 * @param value {String|Number} the value being set.
	 */
	function numberOfToNumber(value) {

		if ( typeof value !== 'number' && value.indexOf('/') !== -1 ) {

			return parseInt(value.split('/')[0])

		} else if ( typeof value !== 'number' && value.indexOf('-') !== -1 ) {

			return parseInt(value.split('-')[0])

		} else if (  typeof value === 'number' ) {

			return value
		} else {

			return 0
		}
	}

	// schemas.

	var albumSchema = new Schema({
		  _collections : [{type : ObjectId, ref : 'Collection'}]
		, name : { type : String, default : "Unknown Album" }
		, artist : { type : ObjectId, ref : 'Artist' }
		, genre : String
		, art : {}
		, year : Number
		, tracks : [{type : ObjectId, ref : 'Track'}]
	}, { collection : "albums" })

	var artistSchema = new Schema({
		  _collections : [{type : ObjectId, ref : 'Collection'}]
		, name : String
		, albums : [{type : ObjectId, ref : 'Album'}]
	}, { collection : "artists" })

	var trackSchema = new Schema({
		  _collections : [{type : ObjectId, ref : 'Collection'}]
		, title : { type : String, default : "Unknown Title" }
		, artist : { type : ObjectId, ref : 'Artist' }
		, album : { type : ObjectId, ref : 'Album' }
		, track : { type : Number, default : 0, set : numberOfToNumber }
		, mime : String
		, bitRate : Number
		, duration : Number
		, size : Number
		, path : String
	}, {
		collection : "tracks"
	})

	var playlistSchema = new Schema({
		  _user : {type : ObjectId, ref : 'User'}
		, name : String
		, tracks : [{type : ObjectId, ref : 'Track'}]
	}, {
		collection : "playlists"
	})

	var collectionSchema = new Schema({
		  _users : [{type : ObjectId, ref : 'User'}]
		, path : String
		, tracks : [{type : ObjectId, ref : 'Track'}]
		, checksum : String
	}, {
		collection : "collections"
	})

	var userSchema = new Schema({
		  name : String
		, digest : String
		, properties : {}
		, collections : [{type : ObjectId, ref : 'Collection'}]
		, playlists : [{type : ObjectId, ref : 'Playlist'}]
	}, {
		collection : "users"
	})

	var settingSchema = new Schema({
		  key : String
		, value : String
	}, {
		collection : "settings"
	})

	// models.
	var Track = mongoose.model('Track', trackSchema)
	  , Album = mongoose.model('Album', albumSchema)
	  , Artist = mongoose.model('Artist', artistSchema)
	  , Playlist = mongoose.model('Playlist', playlistSchema)
	  , Collection = mongoose.model('Collection', collectionSchema)
	  , User = mongoose.model('User', userSchema)
	  , Setting = mongoose.model('Setting', settingSchema)

	return {
		  mongoose : mongoose
		, Model : {
			  Track : Track
			, Album : Album
			, Artist : Artist
			, Playlist : Playlist
			, Collection : Collection
			, User : User
			, Setting : Setting
		}
		, Schema : {
			  Track : trackSchema
			, Album : albumSchema
			, Artist : artistSchema
			, Playlist : playlistSchema
			, Collection : collectionSchema
			, User : userSchema
			, Setting : settingSchema
		}
	}
})