var express = require('express');
var router = express.Router();

module.exports = function(db, logger){

	router.get('/*', function(req, res, next) {
		res.end('Pong!');
	});
	
	return router;
}
