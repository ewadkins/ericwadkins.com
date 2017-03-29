var express = require('express');
var router = express.Router();
var analytics = require('../analytics');

module.exports = function(db, logger){

	router.get('/', function(req, res, next) {
        var args = {};
        for (var key in req.query) {
            if (req.query.hasOwnProperty(key)) {
                args[key] = typeof(req.query[key]) === 'string' ? req.query[key] : req.query[key][0];
            }
        }
        analytics.run(args, function(output) {
            res.send(output);
        });
	});
	
	return router;
}