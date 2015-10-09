var config = require('./config');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy');
var fs = require('fs');

function create(db) {

	var app = express();

	// view engine setup
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');

	var winston = require('winston');
	var morgan = require('morgan');
	var logDirectory = path.join('./', config.server.logDirectory);
	fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
	var logger = new winston.Logger({
	    transports: [
	                 new winston.transports.File({
	                     level: 'info',
	                     filename: logDirectory + '/all-logs.log',
	                     handleExceptions: true,
	                     json: true,
	                     maxsize: 5242880, //5MB
	                     maxFiles: 5,
	                     colorize: false
	                 }),
	                 new winston.transports.Console({
	                     level: 'debug',
	                     handleExceptions: true,
	                     json: false,
	                     colorize: true
	                 })
	                 ],
	                 exitOnError: false
	});
	logger.stream = {
	        write: function(message){
	            logger.info(message);
	        }
	};
	app.use(morgan('dev', { stream: logger.stream }));

	// uncomment after placing your favicon in /public
	//app.use(favicon(path.join(__dirname, 'public/images/favicon.ico')));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(busboy());
	app.use(cookieParser());
	
    app.use(express.static(path.join(__dirname, config.server.publicDirectory)));

	app.use('/', require(path.join(__dirname, config.server.routesDirectory, 'index'))(db));
    
	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
	  var err = new Error('Not Found');
	  err.status = 404;
	  next(err);
	});

	// error handlers
    app.use(function(err, req, res, next) {
    	if (!err.status) {
    		logger.error(err);
    		throw err;
    	}
        if (app.get('env') === 'development') {
            res.status(err.status || 500);
            res.render('error', {
                       message: err.message,
                       error: err
                       });
        }
        else {
            res.status(err.status || 500);
            res.render('error', {
                       message: err.message,
                       error: {}
                       });
        }
    });
    
	return [app, logger];
}

module.exports = create;
