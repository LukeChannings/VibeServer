#Vibe Server


##Socket standard scheme.

Once the client is connected a socket will be opened between the server and client, an event is handled using socket.on, and emitted by the server using socket.emit.

The following standard is used when emitting an event:

	emit( 'name of event', {data object}, function callback() )

The event can be handled using the following:

	on( 'name of event', function(data, callback) { … } )

##Events

This section documents all events that are emitted by the the server, as well as events that it responds to from the client.

Please see the section above for the standard usage of events, how data should be emitted and handled.

###metadata

The metadata event is used for getting the metadata for an item in the collection.