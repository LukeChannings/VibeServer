/**
 * Vibe Api and HTTP music streaming server.
 */
define(['http', 'socket.io', 'crypto', 'api.metadata'], function( http, socketio, crypto, MetadataApi ) {

	return function( settings, db, users, callback ) {

		// create servers.
		var vibeServer = http.createServer().listen(settings.get('port') || 6232)
		  , socketIO = socketio.listen(vibeServer)
		  , socketIOClients = []

		// metadata Api instance.
		  , metadataApi = new MetadataApi(db, users)

		// configure socket.io
		socketIO.enable('browser client minification')
		socketIO.enable('browser client gzip')
		socketIO.enable('browser client etag')
		socketIO.set('log level', 0)
	
		// authorisation.
		socketIO.set('authorization', function(handshakeData, callback) {

			// authenticate anyone when no users are configured.
			if ( users.length() === 0 ) {

				callback(false, true)

				return
			}

			var user = handshakeData.query.u
			  , token = handshakeData.query.tk
			  , _token = new Buffer(handshakeData.address.address).toString('base64')
			  , auth = crypto.createHash('sha256').update(user + _token).digest('hex')
			  , c = handshakeData.query.c


			// check the tokens match.
			if ( token !== _token ) {

				callback(false, false)

				return
			}

			// find the user.
			users.find(user, function(err, _user) {

				if (err || ! _user ) {

					callback(err, false)

				} else {

					var _c = crypto.createHash('sha256').update(auth + _user.digest).digest('hex')

					if ( c === _c ) {

						callback(false, true)

					} else {

						callback(false, false)
					}
				}
			})
		})

		// handle incoming connections.
		socketIO.sockets.on('connection', function(socket) {

			socketIOClients.push(socket)

			socket.on('disconnect', function() {

				// remove the socket.
				socketIOClients.splice(socketIOClients.indexOf(socket), 1)
			})

			if ( users.length() === 0 ) {

				console.log("Server is in setup mode.")

				socket.emit('setup', function(user, callback) {

					users.create(user, function(err) {

						if ( ! err ) {

							console.log("The server has been set up.")
						} else {

							console.error(err)
						}

						// disconnect the socket so that it can reauthenticate with the configured user.
						socket.disconnect()
					})
				})
			} else {

				socket.emit('ready')

				// bind users responder.
				socket.on('user', users.eventResponder.bind(users))

				// bind metadata api.
				socket.on('metadata', metadataApi.eventResponder.bind(socket))
			}
		})

		// static HTTP routes.
		vibeServer.on('request', function(req, res) {

			// return the base64 encoded remote address as a token.
			if ( /token$/.test(req.url) ) {

				var token = new Buffer(req.connection.remoteAddress).toString('base64')

				res.setHeader("Access-Control-Allow-Origin", "*")

				res.end(token)
			}
		})

		callback && callback(this)
	}
})