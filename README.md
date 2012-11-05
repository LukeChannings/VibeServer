#Vibe Server

The Vibe Server provides an Api for use with a Vibe Client. The server supports multiple 
user accounts with multiple music collections, and the server requires authentication to
establist a connection.

#Installation

##Windows

###Mongodb

Download and install mongodb following the installation instructions here: http://docs.mongodb.org/manual/tutorial/install-mongodb-on-windows

###ffprobe

Download ffmpeg from here: http://ffmpeg.zeranoe.com/builds, download 32-bit or 64-bit depending on your architecture. Always download the static build. Once downloaded, unzip and copy the ffprobe binary to C:\Windows and delete the rest.

Test that this works by running cmd.exe and running `ffprobe /?`.

###Node.js

Install Node.js from http://nodejs.org.

###Vibe

Download VibeServer (unstable branch) from here: https://github.com/TheFuzzball/Vibe/archive/unstable.zip.

Unzip the archive, open cmd.exe and run:

-> cd DOWNLOAD_DIRECTORY
-> npm install
-> start node VibeServer

###Setup

The Vibe Server is running, but is in setup mode. To set up the server, navigate to the tests directory in the unziped VibeServer archive and edit tests.js.

Edit the first test "server setup", ensure the io.connect call is pointing to the correct server, and modify the setupData object literal to reflect your options.

Run the test by dragging the index.html into a browser and appending ?testNumber=1 to the end of the URL, if setup suceeds the server output will immediately start logging scanned music files.

If the test passes then the server was correctly set up.