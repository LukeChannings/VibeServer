/**
 * Vibe Server
 * @description provides Api for use with a Vibe Client.
 * @author Luke Channings
 * @copyright 2012, All Rights Reserved.
 */

var requirejs = require('requirejs')
  , vibe = { isScanning : false }

// require.js configuration.
requirejs.config({
	  nodeRequire : require
	, baseUrl: __dirname + '/src'
	, deps : [
		  'db'
		, 'settings'
		, 'user'
		, 'collection'
		, 'api.vibe'
	]
	, callback : function( db, Settings, Users, Collection, VibeApi ) {

		new Settings(db, function( settings ) {

			new Users(db, function(users) {

				new Collection(db, settings, function( collections ) {

					new VibeApi( settings, db, users, function( api ) {

						// set instances as properties of the vibe object.
						vibe.db = db
						vibe.users = users
						vibe.settings = settings
						vibe.collections = collections
						vibe.api = api

						// call init in the context of the vibe object.
						init.call(vibe)
					})
				})
			})
		})
	}
})

/**
 * checks all collections are up to date every 5 minutes.
 */
vibe.updateCollections = function() {

	var self = this

	// don't check the collection whilst scanning is in progress.
	if ( ! this.isScanning ) {

		self.users.getCollectionModels(false, function( collections ) {

			self.collections.update(collections)

			setTimeout(self.updateCollections.bind(self), 300000)
		})

	} else {

		setTimeout(self.updateCollections.bind(self), 300000)
	}
}

/**
 * initialises Vibe.
 */
function init() {

	var self = this

	global.vibe = vibe

	// significantly slows down scanning.
	this.settings.set('lastfm_albumart', true)

	// check the collection is up to date every 5 minutes.
	this.updateCollections()

	// update the collecitons when a user is created.
	this.users.on('user created', this.updateCollections.bind(this))

	// when the scanning state changes set the isScanning property.
	this.collections.on('scanning state changed', function(state) {

		self.isScanning = state
	})
}