#Vibe Server

##Socket standard scheme.

Once the client is connected a socket will be opened between the server and client, an event is handled using socket.on, and emitted by the server using socket.emit.

The following standard is used when emitting an event:

	emit( 'name of event', {data object}, function callback() )

The event can be handled using the following:

	on( 'name of event', function(data, callback) { … } )

##User Events

###addUser << (userData {Object}, callback {Function})

The addUser event creates a user in the database, the userData object must conform to the following schema:

	var User = new Schema({
		  name : String
		, digest : String
		, properties : {}
		, collections : [Collection]
		, playlists : [Playlist]
	})

__Note__: every user property except the name can be modified after creation. 

Example:

	socket.emit(
		  'addUser'
		, {name : userName, password : "foo"}
		, function(err) {

			if ( err ) {
				// handle error
			}

			// success.
		  }
	)

__Note__: a password property will be transformed into a digest property by the create user method.