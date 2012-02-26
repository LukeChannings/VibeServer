#MusicMe Daemon.#

This daemon will run on the computer with the music with the purpose of serving the music to a MusicMe client. The daemon provides two key features to the client through an API: a) Getting collection data, e.g. Artists, Albums, Genres, etc. as well as more complicated queries, b) A stream of the audio file in its original format, without transcoding. (The method of playing is left up to the client, MM2 is probably the best choice.)

The daemon will scan the following formats: _MP3_, _OGG_, _WAV_, _AAC_, _M4A_. The API will be available through socket.io, (,) which will support WebSockets and JSON long polling. Clients should include socket.io including the following URI: __http://host:port/socket.io/socket.io.js__ in a script.

Streaming can be accessed through __http://host:port/stream/:hash__, where :hash is the id of the track to be streamed. (The id is found using the API.)

##Configuration.##

Basic MusicMe configuration is set through the __settings.json__ file, which includes two basic settings: the collection path, (where your music is located,) and the port (which the daemon will listen on.)

##Todo before 1.0##

1. Switch from musicmetadata to taglib
2. Find a way to determine track duration. --DONE--
3. Implement HTTP 206 Partial Content for streaming. --DONE--
4. Implement directory watching.
5. Test cross-platform. (Only tested on OS X presently.)
6. Add authentication options for socket.io and streaming.