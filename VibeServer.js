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
		, 'fs.musicFinder'
		, 'fs.metadata'
		, 'api.vibe'
	]
	, callback : function( db, Settings, Users ) {

		var _arguments = Array.prototype.splice.call(arguments, 0)

		// create a settings instance.
		new Settings(db, function( settings ) {

			// push the instance into the initialisation arguments.
			_arguments.push(settings)

			// create a users instance.
			new Users(db, function( users ) {

				// push the users instance into the initialisation arguments.
				_arguments.push(users)

				// initialise in the context of the root vibe object
				// with the dependencies arguments.
				init.apply(vibe, _arguments)
			})
		})
	}
})

// VibeServer initialisation.
function init( db, Settings, Users, musicFinder, fsMetadata, VibeApi, settings, users ) {

	new VibeApi( settings, db, users )
}