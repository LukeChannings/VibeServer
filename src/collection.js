define(['walk', 'mime', 'async', 'crypto', 'node-ffprobe', 'api.lastfm', 'events'], function( walk, mime, async, crypto, probe, lastfm, events ) {

	var Model
	  , Track
	  , defaultMimeTypes = ["audio/mpeg"]
	  , settings

	/**
	 * constructor.
	 * @param db {Object} the database instance.
	 * @param _settings {Object} the settings instance.
	 * @param callback {Function} called when the instance is constructed.
	 */
	var Collection = function( db, _settings, callback ) {

		settings = _settings

		Model = db.Model.Collection

		Track = db.Model.Track

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

		var collection = new Model({
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

		console.log("Scan called.")

		async.forEachSeries(

			tracks,

			function(path, next) {

				Track.findOne({path : path}, function(err, existingTrack) {

					if ( ! existingTrack ) {

						console.log("Scanning " + path)

						probe(path, function(err, data) {

							var track = new Track({
								  collections : [collection._id]
								, path : path
								, title : data.metadata.title
								, artist : data.metadata.artist
								, albumArtist : data.metadata.album_artist
								, album : data.metadata.album
								, track : data.metadata.track
								, genre : data.metadata.genre
								, year : data.metadata.date
								, mime : mime.lookup(path)
								, bitRate : data.format.bit_rate
								, duration : data.format.duration
								, size : data.format.size
							})

							if ( settings.get('lastfm_albumart') === true ) {

								Track.findOne({artist : track.artist, album : track.album}, function(err, _track) {

									if ( _track && _track.albumArt !== undefined ) {

										track.albumArt = _track.albumArt

										track.save(function() {

											collection.tracks.push(track)

											collection.save(next)
										})

									} else {

										lastfm.getAlbumArt(track, function(err, track) {

											track.save(function() {

												collection.tracks.push(track)

												collection.save(next)
											})
										})
									}
								})

							} else {

								track.save(function() {

									collection.tracks.push(track)

									collection.save(next)
								})
							}
						})
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

	return Collection
})