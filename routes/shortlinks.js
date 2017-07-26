var config = require('../config');
var express = require('express');
var path = require('path');
var router = express.Router();

module.exports = function(db, logger){

	router.get('/s', function(req, res, next) {
		res.redirect(path.join('/', config.server.schedule));
	});

	router.get('/r', function(req, res, next) {
		res.redirect(path.join('/', config.server.resume));
	});

	router.get('/p/1', function(req, res, next) {
		res.redirect(path.join('/', config.server.p1));
	});

	router.get('/p/2', function(req, res, next) {
		res.redirect(path.join('/', config.server.p2));
	});

	router.get('/d', function(req, res, next) {
		res.redirect(path.join('/', config.server.dashboard));
	});

	router.get('/a', function(req, res, next) {
		res.redirect(path.join('/', config.server.analytics));
	});

	router.get('/m', function(req, res, next) {
		res.redirect(path.join('/', config.server.map));
	});

	router.get('/vd', function(req, res, next) {
		res.redirect(path.join('/', config.server.viewdata));
	});
	
	return router;
}