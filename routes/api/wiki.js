var express = require('express');
var router = express.Router();
var wikiShortestPath = require('../../WikiShortestPath/wikiShortestPath');

module.exports = function(db){

	/*var sessions = {};
	
	setInterval(function() {
		
	}, 100);*/
	
	router.get('/', function(req, res, next) {
        var document = app.buildDocument(req.query, { start: 'string', goal: 'string' });
		/*var key;
		while (!key || sessions[key]) {
			key = Math.random().toString(26).slice(2);
		}
		sessions[key] = { key: key, lastRequest: new Date() };
		res.end(key);*/
		wikiShortestPath(document.start, document.goal, function(result) {
            console.log(result);
			res.json(result);
		});
	});
	
	/*router.get('/progress', function(req, res, next) {
        var document = app.buildDocument(req.query, { key: 'string' });
		if (!document.key) {
			res.json({});
		}
		else {
			sessions[key].lastRequest = new Date();
			res.end(key);
			wikiShortestPath(req.query.start, req.query.goal, function(result) {
				res.json(result);
			});
		}
	});*/
	
	return router;
}