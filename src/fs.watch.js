define(["fs", "walk", "mime"], function(fs, walk, mime) {

	function listSubdirectories(path) {

		var walker = walk.walk(path, { followLinks : false })
		  , subdirectories = []

		walker.on("directories", function(root, stat, next) {

			subdirectories.push(root)

			next()
		})
	}

	return function(path) {

		var walker = walk.walk(path, { followLinks : false })
		  , subdirectories = []

		walker.on("directories", function(root, stat, next) {

			subdirectories.push(root)

			console.log(stat)

			next()
		})

		walker.on("end", function() {

			/*
			subdirectories.forEach(function(path) {

				console.log("watching " + path)

				fs.watch(path, function(event, file) {

					console.log(event + " - " + path)
				})
			})
*/
		})
	}
})