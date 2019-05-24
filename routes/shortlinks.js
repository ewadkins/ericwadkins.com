var config = require('../config');
var express = require('express');
var path = require('path');
var router = express.Router();

module.exports = function(db, logger){

	router.get('/s', function(req, res, next) {
		res.redirect('/schedule');
	});

	router.get('/r', function(req, res, next) {
		res.redirect('/resume');
	});

	router.get('/thesis', function(req, res, next) {
		res.redirect(path.join('/', config.server.thesis));
	});

	router.get('/p/1', function(req, res, next) {
		res.redirect(path.join('/', config.server.p1));
	});

	router.get('/p/2', function(req, res, next) {
		res.redirect(path.join('/', config.server.p2));
	});

	router.get('/p/3', function(req, res, next) {
		res.redirect(path.join('/', config.server.p3));
	});

	router.get('/d', function(req, res, next) {
		res.redirect('/dashboard');
	});

	router.get('/a', function(req, res, next) {
		res.redirect('/analytics');
	});

	router.get('/m', function(req, res, next) {
		res.redirect('/map');
	});

	router.get('/vd', function(req, res, next) {
		res.redirect('/api/viewdata');
	});

	router.get('/about', function(req, res, next) {
		res.redirect('/#about');
	});

	router.get('/education', function(req, res, next) {
		res.redirect('/#about');
	});

	router.get('/skills', function(req, res, next) {
		res.redirect('/#skills');
	});

	router.get('/projects', function(req, res, next) {
		res.redirect('/#projects');
	});

	router.get('/papers', function(req, res, next) {
		res.redirect('/#papers');
	});

	router.get('/timeline', function(req, res, next) {
		res.redirect('/#timeline');
	});

	router.get('/experience', function(req, res, next) {
		res.redirect('/#timeline');
	});

	router.get('/contact', function(req, res, next) {
		res.redirect('/#contact');
	});
	
	return router;
}