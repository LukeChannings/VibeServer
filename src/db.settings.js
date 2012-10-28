/**
 * stores settings.
 */
define(function() {

	var db
	  , Setting
	  , SettingSchema
	  , store = {}
	  , ready = false

	/**
	 * constructor
	 * @param _db {Object} the database object containing the connection socket.
	 * @param callback {Function} called when the store has been populated with the database settings.
	 */
	var Settings = function( _db, callback ) {

		if ( ! _db ) {
			return false
		} else {
			db = _db
		}

		var self = this

		Setting = db.Model.Setting

		Setting.find(function(err, result) {

			result.forEach(function(setting) {

				store[setting.key] = setting.value
			})

			ready = true

			callback && callback(self)
		})
	}

	/**
	 * @param key {String} the key of the setting to fetch the value for.
	 * @return {String} the setting value.
	 */
	Settings.prototype.get = function( key ) {

		if ( ready && store[key] ) {

			return store[key]
		} else {

			return false
		}
	}

	/**
	 * @param key {String} the key of the setting to fetch the value for.
	 * @param callback {Function} called with err as the first parameter and the result as the second.
	 */
	Settings.prototype.getAsync = function( key, callback ) {

		Setting.find({key : key}, function(err, result) {

			if ( err ) {
				callback && callback(err)
			}

			callback && callback(false, result[0].value)
		})
	}

	/**
	 * @param key {String} the key of the setting.
	 * @param value {String} the value of the setting.
	 * @param callback {Function} called with err as the first parameter.
	 */
	Settings.prototype.set = function(key, value, callback) {

		// keep key in memory store.
		store[key] = value

		// set the value in the database.
		Setting.update({key : key}, {value : value}, {upsert : true, multi : false}, function(err) {

			callback && callback(err)
		})
	}

	/**
	 * @param key {String} the setting key to remove.
	 * @param callback {Function} called with err as the first parameter.
	 */
	Settings.prototype.unset = function(key, callback) {

		if ( store[key] ) {
			delete store[key]
		}

		Setting.where('key').equals(key).remove(callback)
	}

	return Settings
})