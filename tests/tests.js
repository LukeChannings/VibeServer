module("Vibe Server Api tests.", {
	setup : function() {

		this.user = "Luke"
		this.password = "toor"
		this.token = "MTI3LjAuMC4x"
		this._auth = Sha256.hash(this.user + this.password)
		this.auth = Sha256.hash(Sha256.hash(this.user + this.token) + this._auth)
	}
})

asyncTest("authentication - no login parameters.", function() {

	expect(1)

	var socket = io.connect("http://localhost:6232", {
		'force new connection' : true
	})

	socket.on('error', function() {

		ok(true, "Error event was emitted.")

		start()
	})

	socket.on('connect', function() {

		ok(false, "Connect event was emitted.")

		socket.on('setup', function(callback) {

			callback({
				name : "Luke",
				password : "toor",
				collections : ["/Volumes/Media/Music"]
			}, function() {

				console.log("Set up new user.")
			})
		})

		start()
	})
})

asyncTest("authentication - invalid login parameters", function() {

	expect(1)

	var socket = io.connect("http://localhost:6232?u=foo&c=123", {
		'force new connection' : true
	})

	socket.on('error', function() {

		ok(true, "Error event was emitted.")

		start()
	})

	socket.on('connect', function() {

		ok(false, "Connect event was emitted.")

		start()
	})
})

asyncTest("authentication - valid login parameters", function() {

	expect(1)

	var socket = io.connect("http://localhost:6232?u=" + this.user + "&c=" + this.auth + "&tk=" + this.token, {
		'force new connection' : true
	})

	socket.on('error', function(err) {

		ok(false, "Error event was emitted.")

		console.log(err)

		start()
	})

	socket.on('connect', function() {

		ok(true, "Connect event was emitted.")

		start()
	})
})

asyncTest("user event - create user", function() {

	expect(2)

	var user = "testUser"
	  , password = "testPassword"

	var socket = io.connect("http://localhost:6232?u=" + this.user + "&c=" + this.auth + "&tk=" + this.token, {
		'force new connection' : true
	})

	socket.on('error', function(err) {

		ok(false, "error event was emitted.")

		start()
	})

	socket.on('connect', function() {

		ok(true, "connect event was emitted.")

		socket.emit(

			'user',

			'create',

			{
				name : user,
				password : password,
				properties : {"abc" : "def"}
			},

			function(err) {

				if ( err ) {

					ok(false, "there was an error creating the user. " + err)
				} else {

					ok(true, "test user was created.")
				}

				start()
			}
		)
	})
})

asyncTest("user event - get user", function() {

	expect(4)

	var user = "testUser"
	  , password = "testPassword"

	var socket = io.connect("http://localhost:6232?u=" + this.user + "&c=" + this.auth + "&tk=" + this.token, {
		'force new connection' : true
	})

	socket.on('error', function(err) {

		ok(false, "error event was emitted.")

		start()
	})

	socket.on('connect', function() {

		ok(true, "connect event was emitted.")

		socket.emit(

			'user',

			'find',

			user,

			function(err, user) {

				if ( err ) {

					ok(false, err)
				} else {

					ok(true, "got user data")

					equal(user.properties.abc, "def", "successfully read user property.")

					ok(!user.digest, "user digest was not sent.")
				}

				start()
			}
		)
	})
})

asyncTest("user event - delete user", function() {

	var user = "testUser"
	  , password = "testPassword"
	  , auth = Sha256.hash(user + password)

	var socket = io.connect("http://localhost:6232?u=" + this.user + "&c=" + this.auth + "&tk=" + this.token, {
		'force new connection' : true
	})

	socket.on('error', function(err) {

		ok(false, "error event was emitted.")

		start()
	})

	socket.on('connect', function() {

		ok(true, "connect event was emitted.")

		socket.emit(

			'user',

			'delete',

			user,

			auth,

			function(err) {

				if ( err ) {
					ok(false, err)
				} else {

					ok(true, "removed test user.")
				}

				start()
			}
		)
	})
})

asyncTest("metadata - get genres", function() {

	expect(1)

	var socket = io.connect("http://localhost:6232?u=" + this.user + "&c=" + this.auth + "&tk=" + this.token, {
		'force new connection' : true
	})

	socket.on('error', function(err) {

		ok(false, "Error event was emitted.")

		console.log(err)

		start()
	})

	socket.on('connect', function() {

		ok(true, "Connect event was emitted.")

		socket.emit('metadata', 'getGenres', function(err, genres) {

			console.log(err)
			console.log(genres)
		})

		start()
	})
})