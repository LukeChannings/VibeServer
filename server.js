/**
 * Server
 * @description Socket.io server.
 */
function Server(){

	// make a socket.io instance and listen on the default port.
	var io = require('socket.io').listen(settings.get('port'));
	
	/**
	 * getArtists
	 * @description Returns an array of artist objects.
	 * @param callback - function to be sent the result.
	 */
	io.on('getArtists',function(callback){});

	/**
	 * getAlbums
	 * @description Lists all albums in the collection.
	 * @param callback - function to be sent the result.
	 */
	io.on('getAlbums',function(callback){});
	
	/**
	 * getGenres
	 * @description Lists all genres in the collection.
	 * @param callback - function to be sent the result.
	 */
	io.on('getGenres',function(callback){});
	
	/**
	 * getArtistAlbums
	 * @description Lists the albums belonging to a given artist.
	 * @param artist_id - the id of the artist to list albums for.
	 * @param callback - function to be sent the result.
	 */
	io.on('getArtistAlbums',function(artist_id,callback){});
	 
	/**
	 * getAlbumTracks
	 * @description Lists the tracks belonging to a given album.
	 * @param album_id - the id of the album to list tracks for.
	 * @param callback - function to be sent the result.
	 */
	io.on('getAlbumTracks',function(album_id,callback){});
	 
	/**
	 * getArtistTracks
	 * @description Lists all tracks belonging to a given artist.
	 * @param artist_id - the id of the artist to list albums for.
	 * @param callback - function to be sent the result.
	 */
	io.on('getArtistTracks',function(artist_id,callback){});
	 
	/**
	 * getAlbumArtURI
	 * @description Returns an array of URIs to album art. (small, medium, large.)
	 * @param callback - function to be sent the result.
	 */
	io.on('getAlbumArtURI',function(callback){});

		
}

module.exports = Server;