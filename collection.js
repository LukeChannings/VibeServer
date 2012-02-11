var sqlite = require("sqlite3");

function Collection(){

	var sock = new sqlite.Database("musicme.js");

	function Track(){}
	function Album(){}
	function Artist(){}
	function Genre(){}

	function getMetadata(){}
	
	this.addTrackToCollection = function(){}
	this.removeTrackFromCollection = function(){}

}

module.exports = Collection;