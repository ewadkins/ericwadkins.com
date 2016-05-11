var express = require('express');
var router = express.Router();
var wikiShortestPath = require('../../../WikiShortestPath/wikiShortestPath');

module.exports = function(db){

	router.get('/', function(req, res, next) {
        //var document = app.buildDocument(req.query, { message: 'string' });
        res.end('Pong!');
	});
	
	return router;
}