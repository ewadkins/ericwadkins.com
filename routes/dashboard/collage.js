var config = require('../../config');
var express = require('express');
var path = require('path');
var router = express.Router();

module.exports = function(db, logger){

	router.get('/', function(req, res, next) {
		res.sendFile(path.join(config.server.appDirectory, config.server.publicDirectory, config.server.collage));
	});
	
	return router;
}
