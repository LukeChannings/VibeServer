#MusicMe Daemon.#

This program provides a daemon that runs a RESTful API for use with a MusicMe client,
it will scan the collection and build a database of metadata on the collection.

Presently the structure of the daemon is split into three files: the core, the scanner and
the api. The core handles interactions with the database, the scanner walks a directory and
fetches metadata, and the API will provide a RESTful API for use in a client.

This project is in the baby stage, and everything here is subject to change without warning.