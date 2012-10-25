/**
 * Vibe Server
 * @description provides Api for use with a Vibe Client.
 * @author Luke Channings
 * @copyright 2012, All Rights Reserved.
 */

var requirejs = require('requirejs')
  , vibe = {}

// require.js configuration.
requirejs.config({
	  nodeRequire : require
	, baseUrl: __dirname + '/src'
	, deps : [
		  'db'
		, 'db.settings'
		, 'db.users'
		, 'collection'
		, 'api.vibe'
	]
	, callback : function( db, Settings, Users, Collection, VibeApi ) {

		var _arguments = [db]

		new Settings(db, function( settings ) {

			_arguments.push(settings)

			new Users(db, function(users) {

				_arguments.push(users)

				new Collection(db, settings, function( collections ) {

					_arguments.push(collections)

					new VibeApi( settings, db, users, function( api ) {

						_arguments.push(api)

						init.apply(vibe, _arguments)
					})
				})
			})
		})
	}
})

// VibeServer initialisation.
function init( db, settings, users, collections, api ) {

	// check the collection is up to date every 5 minutes.
	users.getCollectionModels(function(_collections) {

		collections.update(_collections)
	})
}