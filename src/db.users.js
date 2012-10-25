/**
 * controls user accounts.
 */
define(['async', 'crypto'], function( async, crypto ) {

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
		User = db.mongoose.model('User', db.Schemas.User, 'users')

		// get the Collection model.
		Collection = db.mongoose.model('Collection', db.Schemas.Collection, 'collections')

		updateStore(function() {

			callback && callback(self)
		})
	}

	/**
	 * creates a new user.
	 * @param user {Object} object conforming to UserSchema.
	 * @param password {String} the password for the new user. (not saved, used to create a hash.)
	 * @param callback {Function} called when creation has finished, is passed an err parameter.
	 */
	Users.prototype.create = function(userData, password, callback) {

		User.find({name : userData.name}, function(err, user) {

			if ( err ) {

				callback && callback(err)

			} else if ( user.length > 0 ) {

				callback && callback("User " + userData.name + " already exists.")
			} else {

				// create the digest hash.
				userData.digest = crypto.createHash('sha256').update(userData.name + userData.password).digest('hex')

				// delete the password property.
				delete userData.password

				// create a new user.
				new User(userData).save(function() {

					updateStore(callback)
				})

				// create any collections that the user specified.
				userData.collections.forEach(function(collection) {

					new Collection({path : collection}).save()
				})
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

		User.find({name : name}, function(err, user) {

			callback && callback(err, user)
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
	Users.prototype.getCollectionModels = function( callback ) {

		var collections = []

		User.find({}, function(err, users) {

			async.forEach(

				users,

				function( user, _next ) {

					async.forEach(

						user.collections,

						function(path, next) {

							Collection.find({path : path}, function(err, document) {

								collections.push(document)

								_next()
							})
						},

						function() {

							next()
						}
					)
				},

				function() {

					callback(collections)
				}
			)
		})
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