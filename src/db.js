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
	var trackSchema = new Schema({
		  _collections : [{type : ObjectId, ref : 'Collection'}]
		, title : { type : String, default : "Unknown Title" }
		, artist : { type : String, default : "Unknown Artist" }
		, album : { type : String, default : "Unknown Album" }
		, albumArtist : { type : String, default : "Unknown Artist" }
		, track : { type : Number, default : 0, set : numberOfToNumber }
		, genre : String
		, year : { type : Number, default : 0, set : numberOfToNumber }
		, mime : String
		, bitRate : Number
		, duration : Number
		, size : Number
		, albumArt : {}
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
	  , Playlist = mongoose.model('Playlist', playlistSchema)
	  , Collection = mongoose.model('Collection', collectionSchema)
	  , User = mongoose.model('User', userSchema)
	  , Setting = mongoose.model('Setting', settingSchema)

	return {
		  mongoose : mongoose
		, Model : {
			  Track : Track
			, Playlist : Playlist
			, Collection : Collection
			, User : User
			, Setting : Setting
		}
		, Schema : {
			  Track : trackSchema
			, Playlist : playlistSchema
			, Collection : collectionSchema
			, User : userSchema
			, Setting : settingSchema
		}
	}
})