var fs = require('fs')
var config = require('../config');
var express = require('express');
var path = require('path');
var router = express.Router();

module.exports = function(db, logger){

    miscPath = path.join(config.server.appDirectory, config.server.miscDirectory)
    
	router.get('/dir/', function(req, res, next) {
        dirs = fs.readdirSync(miscPath).filter(filename => fs.lstatSync(path.join(miscPath, filename)).isDirectory())
        res.send(dirs.map(name => '<a href="' + name + '">' + name + '</a>').join('<br>'))
	});
    
	router.get('/*', function(req, res, next) {
		if (req.path == '/') {
            res.redirect('/misc/dir')
        } else {
            require('./' + req.path.slice(1).replace(/[^\w]/g, ''))(req, res, next)
        }
	});
	
	return router;
}
