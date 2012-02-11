PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user(
	name VARCHAR(50) NOT NULL PRIMARY KEY,
	password VARCHAR(50) NOT NULL,
	lastfm_name VARCHAR(50),
	lastfm_password VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS profile(
	user_id VARCHAR(50) NOT NULL,
	collection_id INTEGER NOT NULL,
	FOREIGN KEY (user_id) REFERENCES user(name),
	FOREIGN KEY (collection_id) REFERENCES collection(id)
);

CREATE TABLE IF NOT EXISTS collection(
	id INTEGER NOT NULL PRIMARY KEY,
	path VARCHAR(255) NOT NULL,
	shareable BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS track(
	checksum VARCHAR(255) NOT NULL PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	path VARCHAR(255) NOT NULL,
	album_id VARCHAR(255) NOT NULL,
	duration SMALLTIME,
	track_no INT(4),
	plays INT(20),
	rating INT(1),
	collection_id INTEGER,
	FOREIGN KEY (album_id) REFERENCES album(id),
	FOREIGN KEY (collection_id) REFERENCES collection(id)
);

CREATE TABLE IF NOT EXISTS album(
	id VARCHAR(255) NOT NULL PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	artist_id VARCHAR(255) NOT NULL,
	artist VARCHAR(255) NOT NULL,
	track_no INT(4),
	disc_no INT(4),
	disc_of INT(4),
	art_uri VARCHAR(255),
	duration SMALLTIME,
	collection_id INTEGER,
	FOREIGN KEY (artist_id) REFERENCES artist(id),
	FOREIGN KEY (collection_id) REFERENCES collection(id)
);

CREATE TABLE IF NOT EXISTS artist(
	id VARCHAR(255) NOT NULL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	genre VARCHAR(255),
	collection_id INTEGER,
	FOREIGN KEY (collection_id) REFERENCES collection(id)
);

-- Delete all tracks belonging to an album.
CREATE TRIGGER IF NOT EXISTS remove_album DELETE ON album
	BEGIN
		DELETE FROM track WHERE album_id = OLD.id;
	END;
	
-- Delete all albums belonging to an artist.
CREATE TRIGGER IF NOT EXISTS remove_artist DELETE ON album
	BEGIN
		DELETE FROM album WHERE artist_id = OLD.id;
	END;