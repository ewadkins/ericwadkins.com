var config = require('../config');
var express = require('express');
var router = express.Router();
var path = require('path');

module.exports = function(db, logger){
    
	router.get('/', function(req, res, next) {
		res.sendFile(path.join(config.server.appDirectory, config.server.publicDirectory, config.server.analytics));
	});
	
	return router;
}