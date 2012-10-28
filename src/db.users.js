/**
 * controls user accounts.
 */
define(['async', 'crypto', 'events'], function( async, crypto, events ) {

	var User
	  , store = []
	  , db
	  , self
	  , Collection

	/**
	 * constructs an instance.
	 * @param db {Object} the database instance from db.
	 * @param callback {Function} called when the instance is ready.
	 */
	var Users = function( _db, callback ) {

		self = this
		db = _db

		// get the user model.
		User = db.Model.User

		// get the Collection model.
		Collection = db.Model.Collection

		updateStore(function() {

			callback && callback(self)
		})

		// call EventEmitter constructor on the instance.
		events.EventEmitter.call(this)
	}

	// inherit EventEmitter
	Users.prototype.__proto__ = events.EventEmitter.prototype

	/**
	 * creates a new user.
	 * @param user {Object} object conforming to UserSchema.
	 * @param callback {Function} called when creation has finished, is passed an err parameter.
	 */
	Users.prototype.create = function(userData, callback) {

		var self = this

		User.findOne({ name : userData.name }, function(err, user) {

			if ( user || err ) {

				callback && callback("User " + userData.name + " already exists.")
			} else {

				// create the digest hash.
				userData.digest = crypto.createHash('sha256').update(userData.name + userData.password).digest('hex')

				// delete the password property.
				delete userData.password

				var collections = userData.collections

				userData.collections = []

				var newUser = new User(userData)

				if ( collections && collections.length !== 0 ) {

					async.forEachSeries(

						collections,

						function(path, next) {

							Collection.findOne({path : path}, function(err, collection) {

								if ( collection ) {

									newUser.collections.push(collection)

									next()
								} else {

									var _collection = new Collection({
										  path : path
										, _users : [newUser._id]
									})

									newUser.collections.push(_collection)

									_collection.save(next)
								}
							})
						},

						function() {

							newUser.save(function() {

								updateStore(callback)

								self.emit("user created")
							})
						}
					)
				} else {

					newUser.save(function() {

						self.emit("user created")

						updateStore(callback)
					})
				}
			}
		})
	}

	/**
	 * removes a user from the database.
	 * @param name {String} the name of the user to delete.
	 * @param digest {String} the authentication string for the user.
	 * @param callback {Function} called when the operation has completed.
	 */
	Users.prototype.delete = function(name, digest, callback) {

		if ( store.length === 1 ) {

			callback && callback("Unable to delete the last remaining user.")

		} else {

			User.remove({name : name, digest : digest}, callback)
		}
	}

	/**
	 * finds a user
	 * @param name {String} the name of the user
	 * @param callback {Function} called when the operation has completed.
	 */
	Users.prototype.find = function(name, callback) {

		User.findOne({name : name}, callback)
	}

	/**
	 * finds a user and removes the digest property.
	 * @param name {String} the name of the user
	 * @param callback {Function} called when the operation has completed.
	 */
	Users.prototype.findSecure = function(name, callback) {

		// find the user, excluding the digest.
		User.findOne({name : name}).select('-digest').exec(function(err, user) {

			if ( user ) {

				callback(false, user)
			} else {

				callback(err)
			}
		})
	}

	/**
	 * returns the number of users in the database.
	 */
	Users.prototype.length = function() {

		return store.length
	}

	/**
	 * a list of collections that are in use.
	 */
	Users.prototype.getCollectionModels = function( user, callback ) {

		var collections = []

		var query = user ? { name : user } : {}

		User.find(query).populate("collections").exec(function(err, users) {

			users.forEach(function(_user) {

				console.log(collections)

				collections = collections.concat(_user.collections)
			})

			callback && callback(collections)
		})
	}

	/**
	 * responds to Api events and maps them to instance methods.
	 * @param event {String} the name of the event.
	 * @param args {arguments} if the event is matched all arguments will be passed the matching method.
	 */
	Users.prototype.eventResponder = function(event) {

		// re-point events.
		switch ( event ) {

			case "find":

				// re-point to the secure find method.
				event = "findSecure"
				break;
		}
		
		if ( typeof this[event] === 'function' ) {

			this[event].apply(this, Array.prototype.slice.call(arguments, 1))

		} else {

			console.log("user instance has no responder for " + event)
		}
	}

	/**
	 * keeps the store up-to-date with the database.
	 * @param callback {Function} called when the store has been updated.
	 */
	function updateStore(callback) {

		User.find({}, function(err, users) {

			store = users

			callback && callback(err)
		})
	}

	return Users
})