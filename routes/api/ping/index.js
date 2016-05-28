var express = require('express');
var router = express.Router();

module.exports = function(db){

	router.get('/', function(req, res, next) {
        res.end('Pong!');
	});
    
    router.get('/json', function(req, res, next) {
        res.json({ message: 'Pong!' });
        //res.json([]"Pong!"]);
	});
    
    router.post('/', function(req, res, next) {
        //console.log(req.headers);
        //console.log(req.body);
        console.log(req.busboy);
        res.send(req.body);
	});
    
    router.post('/json', function(req, res, next) {
        var json = JSON.parse(req.body);
        console.log(json);
        res.end();
	});
    
    router.head('/', function(req, res, next) {
        console.log("HI")
        console.log(req.headers);
        console.log(req.body.toString());
        res.send(req.body);
	});
    
    router.put('/', function(req, res, next) {
        console.log(req.headers);
        console.log(req.body.toString());
        res.send(req.body);
	});
    
    router.delete('/', function(req, res, next) {
        console.log(req.headers);
        console.log(req.body.toString());
        res.send(req.body);
	});
	
	return router;
}