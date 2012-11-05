/**
 * Vibe Api and HTTP music streaming server.
 */
define(function() {

	// dependencies.
	var http = require('http')
	  , fs = require('fs')
	  , crypto = require('crypto')
	  , socketio = require('socket.io')
	  , stream = require('stream')
	  , MetadataApi = require('api.metadata')

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

			var user = decodeURIComponent(handshakeData.query.u)
			  , token = decodeURIComponent(handshakeData.query.tk)
			  , _token = new Buffer(handshakeData.address.address).toString('base64')
			  , auth = crypto.createHash('sha256').update(user + _token).digest('hex')
			  , c = decodeURIComponent(handshakeData.query.c)


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

			socket.handshakeData = socket.manager.handshaken[socket.id]

			socket.on('disconnect', function() {

				// remove the socket.
				socketIOClients.splice(socketIOClients.indexOf(socket), 1)

				if ( socket.handshakeData.query.role === "player" ) {

					socketIOClients.forEach(function(_socket) {

						if ( _socket.handshakeData.query.role === "controller" ) {

							_socket.emit("playerDisconnected", socket.id)
						}
					})
				}
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

				if ( socket.handshakeData.query.role === "player" ) {

					// bind users responder.
					socket.on('user', users.eventResponder.bind(users))

					// bind metadata api.
					socket.on('metadata', metadataApi.eventResponder.bind(socket))

					socket.on("playstatechanged", function(state, trackid) {

						db.Model.Track.findOne({_id : trackid}).populate("album").populate("artist").exec(function(err, track) {

							socketIOClients.forEach(function(_socket) {

								if ( _socket.handshakeData.query.role === "controller" ) {

									_socket.emit("playerStateChange", socket.id, state, track)
								}
							})
						})
					})
				}

				if ( socket.handshakeData.query.role === "controller" ) {

					socket.on("getPlayerIds", function(callback) {

						var ids = []

						socketIOClients.forEach(function(socket) {

							if ( socket.handshakeData.query.role === "player" ) {

								ids.push(socket.id)
							}
						})

						callback(ids)
					})

					socket.on("relayMessage", function(id) {

						var socket = null

						for ( var i = 0; i < socketIOClients.length; i += 1 ) {

							if ( socketIOClients[i].id === id ) {

								socket = socketIOClients[i]
							}
						}

						if ( socket ) {

							var _arguments = Array.prototype.slice.call(arguments, 1)

							_arguments.unshift('externalEvent')

							socket.emit.apply(socket, _arguments)

						} else {

							callback && callback(false)
						}

					})
				}

				socket.emit('ready')
			}

			if ( socket.handshakeData.query.role === "player" ) {

				socketIOClients.forEach(function(_socket) {

					if ( _socket.handshakeData.query.role === "controller" ) {

						_socket.emit("playerConnected", socket.id)
					}
				})
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

			// handle streaming.
			if ( /\/stream\/.+/.test(req.url) ) {

				stream(req, res, db.Model.Track)
			}

			// retrieve flash crossdomain file.
			// - used to allow soundmanager2's flash to load.
			if ( /crossdomain\.xml$/.test(req.url) ) {
				
				res.setHeader("Access-Control-Allow-Origin", "*")

				fs.readFile('crossdomain.xml', function(err, data) {
				
					if ( err ) {

						res.statusCode = 404
					} else {

						res.statusCode = 200
					}

					res.end(data)
				})
			}

			// serve soundmanager2's swf.
			if ( /soundmanager2.*$/.test(req.url) ) {

				res.setHeader("Access-Control-Allow-Origin", "*")

				var file = req.url.match(/(soundmanager2.*)$/)

				if ( file.length === 0 ) {

					res.statusCode = 404

					res.end()
				} else {

					fs.readFile('lib/' + file[1], function(err, data) {
					
						if ( err ) {

							res.statusCode = 404
						} else {

							res.statusCode = 200
						}

						res.end(data)
					})
				}
			}
		})

		callback && callback(this)
	}
})