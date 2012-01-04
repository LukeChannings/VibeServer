var Core = function(callback){
	
	var self = this;

	var db = this.db = new sqlite.Database('musicme.db',sqlite.OPEN_READWRITE,function(err){
	
		if ( err ) self.createDatabase(callback);
		
		else callback.call(self);
	
	});

}

Core.prototype.createDatabase = function(callback){

	var db = this.db = new sqlite.Database('musicme.db');
	
	var self = this;
	
	db.serialize(function(){
		
		db.run('CREATE TABLE album(name VARCHAR(255) PRIMARY KEY,artist VARCHAR(255) NOT NULL,tracks INT(5),year INT(6),genre VARCHAR(255))');
		
		db.run('CREATE TABLE track(title VARCHAR(255),album VARCHAR(255),path VARCHAR(255) PRIMARY KEY, hash VARCHAR(255), trackno INT(5))',function(){
		
			callback.call(self);
		
		});
		
	});
}

module.exports = Core;