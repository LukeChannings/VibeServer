# Vibe Server


This daemon will run on the computer with the music with the purpose of serving the music to a Vibe client. The daemon provides two key features to the client through an API: a) Getting collection data, e.g. Artists, Albums, Genres, etc. as well as more complicated queries, b) A stream of the audio file in its original format, without transcoding. (The method of playing is left up to the client, MM2 is probably the best choice.)

The daemon will scan the following formats: _MP3_, _OGG_, _WAV_, _AAC_, _M4A_. The API will be available through socket.io, (,) which will support WebSockets and JSON long polling. Clients should include socket.io including the following URI: __http://host:port/socket.io/socket.io.js__ in a script.

Streaming can be accessed through __http://host:port/stream/:hash__, where :hash is the id of the track to be streamed. (The id is found using the API.)

## Docker

    docker build -t vibe-server .
    docker run -d --rm -v ~/Music:/music -p 6232:6232 vibe-server

## Configuration

Basic Vibe configuration is set through the __settings.json__ file, which includes two basic settings: the collection path, (where your music is located,) and the port (which the daemon will listen on.)

## Todo before v1.0

1. Find a way to determine track duration. --DONE--
2. Implement HTTP 206 Partial Content for streaming. --DONE--
3. Implement directory watching.
4. Test cross-platform. (Only tested on OS X presently.) --DONE--
5. Add authentication options for socket.io and streaming. --DONE--
