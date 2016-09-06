
var express = require('express');
var fs = require('fs');

/**
 * Load config file.
 */

var config = require('./config');

/**
 * Module dependencies.
 */

var http = require('http');
var https = require('https');


/**
 * Start the server.
 */

startServer();

var app;
var server;
var port;
var logger;

function startServer() {

    /*
     * Create the app
     */

    temp = create();
    app = temp[0];
    logger = temp[1];

    /**
     * Get port from environment and store in Express.
     */

    port = process.env.PORT || config.server.port
    app.set('port', port);

    /**
     * Create HTTP/HTTPS server.
     */

    if (config.server.useHttps) {
        var options = {
            key: fs.readFileSync(config.server.https.keyPath),
            cert: fs.readFileSync(config.server.https.certPath)
        };
        server = https.createServer(options, app);
        logger.info('HTTPS server listening on port %s', port);
    } else {
        server = http.createServer(app);
        logger.info('HTTP server listening on port %s', port);
    }

    logger.info('========================================');

    /**
     * Listen on provided port, on all network interfaces.
     */

    server.listen(port);
    server.on('error', onError);

}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            logger.error(bind + ' requires elevated privileges\n');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(bind + ' is already in use\n');
            process.exit(1);
            break;
        default:
            throw error;
    }
}


function create() {

    app = express();
    
	// Configure logging
	var winston = require('winston');
	var morgan = require('morgan');
	var logger = new winston.Logger({
	    transports: [
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
    
    var location = process.argv[2];
    if (!location) {
        logger.error('USAGE: node redirect <location>\n');
        process.exit();
    }
    if (location.indexOf('://') === -1) {
        location = 'http://' + location;
    }
    logger.info('Redirecting to: ' + location);

    // Configure paths
    app.use('*', function(req, res) {
        res.redirect(location);
    });

    app.use(function(err, req, res, next) {
        if (!err.status) {
            console.error(err);
            throw err;
        }
        res.status(err.status || 500);
        res.send('<b>' + err.status + ':</b> ' + err.message);
    });

    return [app, logger];

}

module.exports = create;