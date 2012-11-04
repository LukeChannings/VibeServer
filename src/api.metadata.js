/**
 * Metadata queries
 */
define(['async'], function( async ) {

	var db
	  , ObjectId
	  , users
	  , self

	var MetadataApi = function(_db, _users) {

		db = _db
		ObjectId = db.mongoose.Schema.ObjectId
		users = _users
		self = this
	}

	MetadataApi.prototype.eventResponder = function(method) {

		var user = this.manager.handshaken[this.id].query.u
		  , _arguments = Array.prototype.slice.call(arguments, 1)

		if ( typeof self[method] == 'function' ) {

			users.getCollectionModels(user, function( collections ) {

				self[method].apply(collections, _arguments)
			})

		} else {

			console.log("MetadataApi has no method " + method)
		}
	}

	MetadataApi.prototype.getArtists = function(callback) {

		var artists = []
		  , ids = []

		// get genres.
		async.forEachSeries(
			
			this,

			function( collection, next ) {

				db.Model.Artist.find({
					  _collections : collection._id
				}, function(err, _artists) {

					_artists.forEach(function(artist) {

						artist.id = artist._id

						artists.push(artist)
					})

					next()
				})
			},

			function() {

				if ( artists.length > 0 ) {

					artists.sort(function(a,b) {

						if (a.name.toLowerCase() < b.name.toLowerCase()) {
							return -1
						}
						
						if (a.name.toLowerCase() > b.name.toLowerCase()) {
							return 1
						}
						
						return 0
					})

					callback(false, artists)

				} else {

					callback("No artists were found.")
				}
			}
		)
	}

	MetadataApi.prototype.getArtistsInGenre = function(genre, callback) {

		var artists = []
		  , genre = decodeURIComponent(genre)

		db.Model.Album.find({"genre" : genre}, function(err, albums) {

			for ( var i = 0; i < albums.length; i += 1 ) {

				if ( artists.indexOf(albums[i].artist.toString()) === -1 ) {

					artists.push(albums[i].artist.toString())
				}
			}

			async.map(

				artists,

				function(id, callback) {

					db.Model.Artist.findOne({_id : id}).populate("albums").exec(callback)
				},

				function(err, artists) {

					artists.sort(function(a,b) {
			
						if (a.name.toLowerCase() < b.name.toLowerCase()) {
							return -1
						}
						
						if (a.name.toLowerCase() > b.name.toLowerCase()) {
							return 1
						}
						
						return 0
					})

					callback && callback(err, artists)
				}
			)

		})
	}

	MetadataApi.prototype.getAlbums = function(callback) {

		var albums = []

		// get genres.
		async.forEachSeries(
			
			this,

			function( collection, next ) {

				db.Model.Album.find({
					  _collections : collection._id
				}, function(err, _artists) {

					_artists.forEach(function(album) {

						album.id = album._id

						albums.push(album)
					})

					next()
				})
			},

			function() {

				if ( albums.length > 0 ) {

					callback(false, albums)

				} else {

					callback("No albums were found.")
				}
			}
		)
	}

	MetadataApi.prototype.getAlbumsByArtist = function(_id, callback) {

		db.Model.Artist.findOne({_id : _id}).populate("albums").exec(function(err, artist) {

			var albums = []

			async.forEachSeries(

				artist.albums,

				function(album, next) {

					db.Model.Album.findOne({_id : album._id}).populate("artist").populate("tracks").exec(function(err, album) {

						albums.push(album)

						next()
					})
				},

				function() {

					albums.sort(function(a, b) {
					
						if (a.name.toLowerCase() < b.name.toLowerCase()) {
							return -1
						}
						
						if (a.name.toLowerCase() > b.name.toLowerCase()) {
							return 1
						}
						
						return 0
					})

					callback && callback(err, albums)
				}
			)
		})
	}

	MetadataApi.prototype.getTracksInGenre = function(genre, callback) {

		var tracks = []
		  , genre = decodeURIComponent(genre)

		self.getArtistsInGenre(genre, function(err, artists) {

			async.forEachSeries(

				artists,

				function(artist, next) {

					self.getTracksByArtist(artist._id, function(err, _tracks) {

						tracks = tracks.concat(_tracks)

						next()
					})
				},

				function() {

					callback && callback(false, tracks)
				}
			)
		})
	}

	MetadataApi.prototype.getTracksByArtist = function(_id, callback) {

		var tracks = []

		self.getAlbumsByArtist(_id, function(err, albums) {

			async.forEachSeries(

				albums,

				function( album, next ) {

					self.getTracksInAlbum(album._id, function(err, _tracks) {

						tracks = tracks.concat(_tracks)

						next()
					})
				},

				function() {

					callback(false, tracks)
				}
			)
		})
	}

	MetadataApi.prototype.getTracksInAlbum = function(_id, callback) {

		db.Model.Album.findOne({_id : _id}, function(err, album) {

			var tracks = album.tracks

			async.mapSeries(

				tracks,

				function(item, callback) {

					db.Model.Track.findOne({_id : item}).populate("artist").populate("album").exec(function(err, track) {

						callback(err, {
							  trackid : track._id
							, albumname : track.album.name
							, artistname : track.artist.name
							, trackname : track.title
							, trackno : track.track
							, trackof : track.album.tracks.length
							, tracklength : track.duration
							, mime : track.mime
						})
					})
				},

				function(err, tracks) {

					callback(err, tracks)
				}
			)
		})
	}

	MetadataApi.prototype.getTracksInAlbumShort = function(_id, callback) {

		db.Model.Album.findOne({_id : _id}, function(err, album) {

			var tracks = album.tracks

			async.mapSeries(

				tracks,

				function(item, callback) {

					db.Model.Track.findOne({_id : item}).select("_id title track").exec(function(err, track) {

						callback(false, {
							  id : track._id
							, name : track.title
							, trackno : track.track
						})
					})
				},

				function(err, tracks) {

					callback(err, tracks)
				}
			)
		})
	}

	MetadataApi.prototype.getTrack = function(_id, callback) {

		db.Model.Track.findOne({_id : _id}).populate("artist").populate("album").exec(function(err, track) {

			callback(err, {
				  trackid : track._id
				, albumname : track.album.name
				, artistname : track.artist.name
				, trackname : track.title
				, trackno : track.track
				, trackof : track.album.tracks.length
				, tracklength : track.duration
				, mime : track.mime
			})
		})
	}

	MetadataApi.prototype.getGenres = function( callback ) {

		var genres = []

		// get genres.
		async.forEachSeries(
			
			this,

			function( collection, next ) {

				db.Model.Album.find({
					_collections : collection._id
				}).distinct('genre', function(err, _genres) {
	
					_genres.forEach(function(genre) {

						if ( genres.indexOf(genre) === -1 ) {

							genres.push({genre : genre})
						}
					})

					next()
				})

			},

			function() {

				if ( genres.length > 0 ) {

					genres.sort(function(a,b) {
					
						if (a.genre.toLowerCase() < b.genre.toLowerCase()) {
							return -1
						}
						
						if (a.genre.toLowerCase() > b.genre.toLowerCase()) {
							return 1
						}
						
						return 0
					})

					callback(false, genres)
				} else {

					callback("No genres were found.")
				}

			}
		)
	}

	MetadataApi.prototype.search = function() {}

	return MetadataApi
})