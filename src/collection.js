define(['walk', 'mime', 'async', 'crypto', 'node-ffprobe', 'api.lastfm', 'events'], function( walk, mime, async, crypto, probe, lastfm, events ) {

	var db
	  , defaultMimeTypes = ["audio/mpeg"]
	  , settings

	/**
	 * constructor.
	 * @param db {Object} the database instance.
	 * @param _settings {Object} the settings instance.
	 * @param callback {Function} called when the instance is constructed.
	 */
	var Collection = function( _db, _settings, callback ) {

		settings = _settings
		db = _db
		defaultMimeTypes = settings.get('defaultMimeTypes') || ["audio/mpeg"]

		events.EventEmitter.call(this)

		callback && callback(this)
	}

	Collection.prototype.__proto__ = events.EventEmitter.prototype

	/**
	 * creates a collection.
	 * @param path {String} the path to the collection.
	 * @param callback {Function} called when the collection has been created.
	 */
	Collection.prototype.create = function( path, _mimeTypes,  callback ) {

		var self = this

		var collection = new db.Model.Collection({
			  path : path
			, mimeTypes : _mimeTypes || defaultMimeTypes
		})

		self.walk(

			path,

			_mimeTypes,

			function(paths) {

				paths.forEach(function(_path) {

					collection.tracks.push(_path)
				})

				self.scan(collection)
				
			}
		)
	}
	/**
	 * walks a collection and returns a list of all audio files.
	 * @param path {String} the path to the collection.
	 * @param mimes {Array} a list of MIME types to look for.
	 */
	Collection.prototype.walk = function( path, mimes, callback ) {

		var walker = walk.walk(path)
		  , files = []

		walker.on('file', function(root, stat, next) {

			if ( mimes.indexOf(mime.lookup(root + "/" + stat.name)) !== -1 ) {
				files.push(root + "/" + stat.name)
			}

			next()
		})

		walker.on('end', function() {

			callback(files)
		})
	}

	/**
	 * gets metadata from an array of file paths and creates a new track item in the 
	 * @param collection {Document} the mongoose document to add the tracks to.
	 * @param tracks {Array} a list of paths to the tracks.
	 * @param updateExisting {Boolean} updates the existing track document if it exists.
	 * @param callback {Function} called when the scanning has completed.
	 */
	Collection.prototype.scan = function(collection, tracks, updateExisting, callback) {

		var self = this

		self.emit('scanning state changed', true)

		async.forEachSeries(

			tracks,

			function(path, next) {

				db.Model.Track.findOne({path : path}, function(err, existingTrack) {

					if ( ! existingTrack ) {

						console.log("Scanning " + path)

						// get the metadata.
						probe(path, function(err, data) {

							if ( ! data.metadata.artist ) {

								next()

								return;
							}

							// get the artist.
							createArtist(data, collection, function(err, artist) {

								// get the album.
								createAlbum(data, artist, collection, settings.get('lastfm_albumart'), function(err, album) {

									// get the track.
									createTrack(path, data, artist, album, collection, function(err, track) {

										save(artist, album, track, collection)
									})
								})
							})
						})

						// saves the models.
						function save(artist, album, track, collection) {

							artist.save(function(err) {

								album.save(function(err) {

									track.save(function(err) {

										collection.save(next)
									})
								})
							})
						}
					} else {

						console.log("Skipping " + path)

						next()
					}
				})
			},

			function() {

				self.emit('scanning state changed', false)

				collection.save(callback)
			}
		)
	}

	/** 
	 * walks a collection (or collections) and checks that they are up-to-date.
	 * @param collections {Array|Document} an array of Collection documents.
	 * @param hardUpdate {Boolean} disable checks and re-scan all collections.
	 */
	Collection.prototype.update = function(collections, hardUpdate) {

		// fluff
		var self = this

		// ensure collections is an array.
		collections = collections instanceof Array ? collections : [collections]

		// loop the collections.
		async.forEach(

			collections,

			function( collection ) {

				process.stdout.write("Checking " + collection.get('path') + "...\t")

				self.walk(

					collection.get('path'),

					defaultMimeTypes,

					function( files ) {

						var checksum = crypto.createHash('sha256').update(files.join(':')).digest('hex')

						if ( collection.get('checksum') === checksum ) {

							process.stdout.write("nothing to do, it's up-to-date.\r\n")

						} else {

							process.stdout.write("scanning...\r\n")

							self.scan(collection, files, hardUpdate, function() {

								process.stdout.write("Finished scanning " + collection.get('path') + "\r\n")

								collection.set('checksum', checksum).save()
							})
						}
					}
				)
			}
		)
	}

	/**
	 * creates an artist document.
	 * @param data {Object} metadata object returned by node-ffprobe.
	 * @param collection {Document} the collection document.
	 * @param callback {Function} calls back with err {String} and artist {Document}
	 */
	function createArtist(data, collection, callback) {

		db.Model.Artist.findOne({name : data.metadata.artist}, function(err, artist) {

			if ( ! artist ) {

				artist = new db.Model.Artist({
					  _collections : [collection._id]
					, name : data.metadata.artist
				})
			}

			callback(err, artist)
		})
	}

	/**
	 * creates an album document.
	 * @param data {Object} metadata object returned by node-ffprobe.
	 * @param artist {Document} the artist document.
	 * @param colleciton {Document} the colleciton document.
	 * @param getAlbumArt {Boolean} if true lastfm album art will be looked up.
	 * @param callback {Function} calls back with err {String} and album {Document}
	 */
	function createAlbum(data, artist, collection, getAlbumArt, callback) {

		db.Model.Album.findOne({name : data.metadata.album, artist : artist._id}, function(err, album) {

			if ( ! album ) {

				album = new db.Model.Album({
					  _collections : [collection._id]
					, artist : artist._id
					, name : data.metadata.album
					, genre : data.metadata.genre
					, year : data.metadata.date
				})

				artist.albums.push(album)

				if ( getAlbumArt ) {

					lastfm.getAlbumArt({artist : artist.name, album : album.name}, function(err, metadata) {

						album.art = metadata.albumArt

						callback(err, album)
					})
				}
			} else {

				callback(err, album)
			}
		})
	}

	/**
	 * creates a track document.
	 * @param path {String} the path to the track.
	 * @param data {Object} metadata object returned by node-ffprobe.
	 * @param artist {Document} the artist document.
	 * @param album {Document} the album document.
	 * @param collection {Document} the collection document.
	 * @param callback {Function} calls back with err {String} and track {Document}
	 */
	function createTrack(path, data, artist, album, collection, callback) {

		var track = new db.Model.Track({
			  _collections : [collection._id]
			, title : data.metadata.title
			, artist : artist._id
			, album : album._id
			, track : data.metadata.track
			, mime : mime.lookup(path)
			, bitRate : data.format.bit_rate
			, duration : data.format.duration
			, size : data.format.size
			, path : path
		})

		album.tracks.push(track)

		collection.tracks.push(track)

		callback && callback(false, track)
	}

	return Collection
})