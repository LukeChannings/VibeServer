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

		socket.on('setup', function(setup) {

			setup(
				{
					name : "Luke",
					password : "toor",
					collections : [{
						path : "/Volumes/Media/Music"
					}]
				},

				function() {

					console.log("finished setup.")
				}
			)
		})

		socket.on('ready', function() {

			console.log("connection ready.")
		})

		start()
	})
})