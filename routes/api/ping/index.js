var express = require('express');
var router = express.Router();
var wikiShortestPath = require('../../../WikiShortestPath/wikiShortestPath');

module.exports = function(db){

	router.get('/', function(req, res, next) {
        //var document = app.buildDocument(req.query, { message: 'string' });
        res.end('Pong!');
	});
    
    router.get('/json', function(req, res, next) {
        //var document = app.buildDocument(req.query, { message: 'string' });
        res.json({ message: 'Pong!' });
	});
	
	return router;
}