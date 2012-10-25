define(['walk', 'mime', 'async', 'crypto', 'node-ffprobe'], function( walk, mime, async, crypto, probe ) {

	var Model
	  , Track
	  , defaultMimeTypes = ["audio/mpeg"]

	/**
	 * constructor.
	 * @param db {Object} the database object.
	 * @param callback {Function} called when the instance is constructed.
	 */
	var Collection = function( db, settings, callback ) {

		Model = db.mongoose.model('Collection', db.Schemas.Collection, 'collections')

		Track = db.mongoose.model('Track', db.Schemas.Track, 'tracks')

		defaultMimeTypes = settings.get('defaultMimeTypes') || ["audio/mpeg"]

		callback && callback(this)
	}

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

		async.forEachSeries(

			tracks,

			function(path, next) {

				Track.find({path : path}, function(err, track) {

					if ( track.length === 0 ) {

						probe(path, function(err, data) {

							collection.find({'tracks.path' : path}, function(err, _path) {

								if ( _path.length === 0 ) {

									collection.tracks.push(path)
								}
							})

							new Track({
								  path : path
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
							}).save(function(_err) {

								if ( err || _err ) {
									console.error(err || _err)
								}

								next()
							})
						})
					} else {

						console.log("track " + path + " already exists.")

						next()
					}
				})
			},

			callback
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

				console.log("Walking " + collection[0].get('path'))

				self.walk(

					collection[0].get('path'),

					defaultMimeTypes,

					function( files ) {

						var checksum = crypto.createHash('sha256').update(files.join(':')).digest('hex')

						if ( collection[0].get('checksum') === checksum ) {

							console.log(collection[0].get('path') + ' is up-to-date.')

							// do nothing.
						} else {

							console.log('scanning ' + collection[0].get('path'))

							self.scan(collection[0], files, hardUpdate, function() {

								console.log("finished scanning.")

								collection[0].set('checksum', checksum).save()
							})
						}
					}
				)
			}
		)
	}

	return Collection
})