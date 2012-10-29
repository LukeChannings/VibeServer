/**
 * streams an audio file.
 */
define(['fs'], function( fs ) {

	/**
	 * handles a stream request.
	 * @param request {Object} the http request.
	 * @param response {Object} the http response.
	 * @param Track {Model} the mongoose track model.
	 */
	var stream = function(request, response, Track) {

		try {

			var id = request.url.match(/\/stream\/(.+)/)[1]

		} catch(ex) {

			terminate(response)

			return;
		}

		Track.findOne({_id : id}).select("path mime ").exec(function(err, track) {

			if ( track && track.path && ! err ) {

				response.setHeader('Content-Type', track.mime)

				fs.stat(track.path, function(err, stat) {

					if ( err || ! stat ) {

						terminate(response)
					}

					// total size in bytes.
					var total = stat.size
					  , path = track.path

					if ( request.headers.range ) {

						// handle range request.
						partialResponse(request, response, path, total)

					} else {

						response.setHeader('Content-Length', total)
					
						var stream = fs.createReadStream(path)
						
						stream.on('data', function(data) {
						
							response.write(data)
						})
						
						stream.on('end', function() {
						
							response.end()
						})
					}
				})

			} else {

				terminate(response)
			}
		})
	}

	// terminates the response.
	function terminate(response) {

		response.statusCode = 404

		response.end()
	}

	/**
	 * handles HTTP 206 partial requests.
	 * @param request {Object} the http request.
	 * @param response {Object} the http response.
	 * @param path {String} path to the file.
	 * @param total {Number} the length of the track in bytes.
	 */
	function partialResponse(request, response, path, total) {

		// get the range.
		var range = request.headers.range.match(/=(.+)-(.*)/)
		
		// get the range start.
		var start = parseInt(range[1])
		
		// get the range end.
		var end = parseInt(range[2]) || total - 1
		
		// calculate the number of bytes to be sent.
		var chunks = (end - start) + 1
		
		// tell the client we're sending partial content.
		response.statusCode = "206 Partial Content"
		
		// tell the client the range of bytes we're sending.
		response.setHeader("Content-Range", "bytes " + start + "-" + end + "/" + total)
		
		// tell the client the number of bytes we're sending.
		response.setHeader("Content-Length", chunks)
		
		// read in the byte range.
		var stream = fs.createReadStream(path, { start: start, end: end })
		
		// when we have data.
		stream.on('data', function(data) {
		
			// send it to the client.
			response.write(data)
		})
		
		// when we run out of data.
		stream.on('end', function() {
			
			// end our response.
			response.end()
		})
	}

	return stream
})