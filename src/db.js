define(['mongoose', 'db.schemas'], function( mongoose, Schemas ) {

	var db = mongoose.connect('mongodb://localhost/vibe')
	  , schemas = Schemas( mongoose.Schema )

	return {
		  sock : db
		, Schemas : schemas
		, mongoose : mongoose
	}
})