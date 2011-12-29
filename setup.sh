#!/bin/sh

# Edit this.
MUSIC_COLLECTION='/Volumes/Media/Projects/MusicMe/Code/server/test'

# Ignore all of this.

rm musicme.db

node app.js 2> /dev/null

sqlite3 musicme.db "INSERT INTO settings (id,setting) VALUES('collection_path','$MUSIC_COLLECTION')"

node app.js