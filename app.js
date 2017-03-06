var config = require('./config');
var express = require('express');
var serveIndex = require('serve-index');
var oauthServer = require('oauth2-server');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var busboy = require('connect-busboy');
var fs = require('fs');
var geoip = require('geoip-lite');
var dns = require('dns');
var countries = require('./countries');

function create(db) {

	app = express();

	// Configure logging
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

	// Uncomment after placing your favicon in /public
	//app.use(favicon(path.join(__dirname, 'public/images/favicon.ico')));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.raw({ type: function(req) {
        var contentType = req.headers['content-type'];
        return contentType && contentType.startsWith('text');
    } }));
	//app.use(busboy());
	app.use(cookieParser());
    
    /*setTimeout(function() {  
        // Runs the test client
        var runTestClient = require('./runTestClient');
        console.log('Sending test message to Java server');
        runTestClient.run('localhost', 8080, function() {
            console.log('========================================');
            console.log('Sending test message to C++ server');
            runTestClient.run('localhost', 8081, function() {
                console.log('========================================');
            });
        });
    }, 1000);*/
    

	// Add document management functions
	if (db) {
		db.documents = require('./documents')(db, logger);	
	}
    
    // Add document builder (works with query or request body)
    app.buildDocument = require('./buildDocument');
    
    // Add mail functionality (from noreply8345@gmail.com)
    app.mail = require('./mail');

	// Setup oauth model
	/*app.oauth = oauthServer({
		model: require('./oauth-model')(db, logger),
		grants: ['password'],
		debug: true
	});*/
	
	// Log ips
	app.use(function(req, res, next) {
		logger.info(req.ip);
		if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
			logger.info('Body:');
			logger.info(req.body);		
		}
		next();
	});

	// Handle token grant requests
	/*app.all('/oauth/token', app.oauth.grant());
	
	app.oauth.weakAuthentication = function() {
		return function(req, res, next) {
			var body = db.buildDocument(req.body, { clientId: 'string', clientSecret: 'string' });
			if (body.clientId && body.clientSecret && body.clientId === config.appClientId && body.clientSecret === config.appClientSecret) {
				return next();
			}
			res.json({ error: 'Authentication failed' });
		}
	}*/

	// Add GeoIP tracker
    var recentMap = {};
    var timeGranularity = 5 * 60; // 5 minutes
    app.use(function(req, res, next) {
        // Never block the request
        setTimeout(function() {
            var ip = req.headers["X-Forwarded-For"]
                                        || req.headers["x-forwarded-for"]
                                        || req.client.remoteAddress
                                        || '';
            for (var field in recentMap) {
                if (recentMap.hasOwnProperty(field)) {
                    if (new Date().getTime() - new Date(recentMap[field]).getTime() > timeGranularity * 1000) {
                        delete recentMap[field];
                    }
                }
            }
            if (!recentMap[ip]) {
                recentMap[ip] = new Date();
                ip = '18.111.109.38'
                var geo = geoip.lookup(ip);
                var ipv4Index = ip.search(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/);
                if (ipv4Index !== -1) {
                    ip = ip.slice(ipv4Index);
                    if (!geo) {
                        geo = geoip.lookup(ip);
                    }
                }
                reverseLookup(ip, function(err, domains) {
                    var message = 'IP: ' + geoip.pretty(ip) + '\n'
                                + 'Date/Time: ' + new Date() + '\n';
                    var crawler = false;
                    if (!err && domains && domains.length) {
                        message += 'DNS Reverse Lookup: ' + domains + '\n';
                        for (var d = 0; d < domains.length; d++) {
                            if (domains[d].indexOf('crawl') !== -1) {
                                crawler = true;
                                break;
                            }
                        }
                    }
                    else {
                        message += 'DNS reverse lookup failed\n';
                    }
                    if (geo) {
                        message += 'Range: ' + geo.range + '\n'
                            + 'Country: ' + (countries[geo.country] ? countries[geo.country] + ' (' + geo.country + ')' : geo.country) + '\n'
                            + 'Region: ' + geo.region + '\n'
                            + 'City: ' + geo.city + '\n'
                            + 'Latitude/Longitude: ' + geo.ll + '\n';
                    }
                    else {
                        message += 'GeoIP lookup failed\n';
                    }
                    app.mail('info@ericwadkins.com', (crawler ? '(C) ' : '') + 'GeoIP Tracker - ericwadkins.com',
                             message, false, function(success) {
                        if (!success) {
                            logger.error('Error sending GeoIP Tracker email. Results:');
                            logger.error(message);
                        }
                    });
                });
            }
        }, 0);
        next();
    });
    
    function reverseLookup(ip, callback) {
        dns.reverse(ip, function(err, domains) {
            if (err !== null) {
                callback(err, null);
            }
            else {
                callback(null, domains);
            }
	   });
    }
    
	// Configure paths
	app.use('/', require(path.join(__dirname, config.server.routesDirectory, 'index'))(db, logger));
	app.use('/schedule', require(path.join(__dirname, config.server.routesDirectory, 'schedule'))(db, logger));
	app.use('/mail', require(path.join(__dirname, config.server.routesDirectory, 'mail'))(db, logger));
	app.use('/resume', require(path.join(__dirname, config.server.routesDirectory, 'resume'))(db, logger));
	app.use('/signature', require(path.join(__dirname, config.server.routesDirectory, 'signature'))(db, logger));
	app.use('/api/wiki', require(path.join(__dirname, config.server.routesDirectory, 'api/wiki'))(db, logger));
	app.use('/api/collage', require(path.join(__dirname, config.server.routesDirectory, 'api/collage'))(db, logger));
	app.use('/api/ping', require(path.join(__dirname, config.server.routesDirectory, 'api/ping'))(db, logger));
    
	app.use('/dashboard', require(path.join(__dirname, config.server.routesDirectory, 'dashboard/index'))(db, logger));
	app.use('/dashboard/collage', require(path.join(__dirname, config.server.routesDirectory, 'dashboard/collage'))(db, logger));
	app.use('/dashboard/gas', require(path.join(__dirname, config.server.routesDirectory, 'dashboard/gas'))(db, logger));

    app.use('/files', function(req, res, next) {
        if (fs.lstatSync(path.join(__dirname, config.server.publicDirectory, decodeURI(req.url))).isFile()) {
            res.redirect(req.url);
        }
        else {
            serveIndex(path.join(__dirname, config.server.publicDirectory), { icons: true })(req, res, next);
        }
    });
	app.use(express.static(path.join(__dirname, config.server.publicDirectory)));
	
	/*app.get('/test', app.oauth.weakAuthentication(), function(req, res) {
		res.send('Success');
	});*/
	
	// Catch 404 and forward to error handler
	app.use(function(req, res, next) {
	  var err = new Error('Not Found');
	  err.status = 404;
	  next(err);
	});

    app.use(function(err, req, res, next) {
    	if (!err.status) {
    		logger.error(err);
    		throw err;
    	}
    	res.status(err.status || 500);
    	res.send('<b>' + err.status + ':</b> ' + err.message);
    });
    
	return [app, logger];

}

module.exports = create;
