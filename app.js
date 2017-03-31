var config = require('./config');
var express = require('express');
var serveIndex = require('serve-index');
var oauthServer = require('oauth2-server');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var busboy = require('connect-busboy');
var request = require('request');
var fs = require('fs');
var lookup = require('./lookup');
var wiki = require('./wiki-lookup');

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
    
    var untracked = [
        '/vid', // videos load dynamically and may send many requests
        '/analytics'
    ];

	// Add GeoIP tracker
    var recentMap = {};
    var timeGranularity = 5; // 5 seconds (absorbs bursts of requests from a single page)
    app.use(function(req, res, next) {
        // Get ip
        var ip = req.headers["X-Forwarded-For"]
                                    || req.headers["x-forwarded-for"]
                                    || req.client.remoteAddress
                                    || '';
        // Remove expired ips
        for (var field in recentMap) {
            if (recentMap.hasOwnProperty(field)) {
                if (new Date().getTime() - new Date(recentMap[field]).getTime() > timeGranularity * 1000) {
                    delete recentMap[field];
                }
            }
        }
        
        // If not a followup request
        if (!recentMap[ip]) {
            recentMap[ip] = new Date();
            
            // Don't record visits to untracked paths
            for (var i = 0; i < untracked.length; i++) {
                if (req.path.indexOf(untracked[i]) === 0) {
                    return next();
                }
            }
            
            var path = req.path;
        
            // Never block the request
            setTimeout(function() {
                ip = '18.111.11.34'
                lookup(ip, function(data) {
                    var ip = data.ip;
                    var domain = data.domain;
                    var longDomain = data.longDomain;
                    var entity = data.entity;
                    var crawler = data.crawler;
                    var country = data.country;
                    var countryCode = data.countryCode;
                    var region = data.region;
                    var regionCode = data.regionCode;
                    var regionType = data.regionType;
                    var city = data.city;
                    var latLong = data.latLong;
                    var range = data.range;
                    
                    wiki((entity || '').toLowerCase(), function(description) {
                        description = description || '<i>No description found</i>';
                        
                        var message = '<table>';
                        var styleAttr = 'style="width:80px;padding-right:10px"';
                        var unknown = '(unknown)';
                        var dateTime = new Date().toLocaleTimeString('en-US',
                                        { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric',
                                         minute: 'numeric', second: 'numeric', timeZoneName: 'short', hour12: true });

                        // Add date/time
                        message += '<tr><td ' + styleAttr + '><b> Date/Time </b></td><td>'
                            + dateTime + '</td></tr>';

                        // Add target
                        path = path || '/';
                        message += '<tr><td ' + styleAttr + '><b> Target </b></td><td>ericwadkins.com' + (path || unknown) + '</td></tr>';

                        // Add ip and domain info
                        message += '<tr><td ' + styleAttr + '><b> IP Address </b></td><td>' + ip + '</td></tr>'
                        if (domain) {
                            message += '<tr><td ' + styleAttr + '><b> Long Domain </b></td><td>'
                                + (longDomain || unknown) + '</td></tr>';
                            message += '<tr><td ' + styleAttr + '><b> Domain </b></td><td>'
                                + (domain || unknown) + '</td></tr>';
                            message += '<tr><td ' + styleAttr + '><b> Entity </b></td><td>'
                                + (entity || unknown) + '</td></tr>';
                            message += '<tr><td ' + styleAttr + '><b> Crawler? </b></td><td>'
                                + (crawler ? 'Yes' : 'No') + '</td></tr>';

                            // Add wiki description
                            message += '<tr><td ' + styleAttr + '><b>Description</b></td><td>'
                                + description + '</td></tr>';
                        }
                        else {
                            message += '<tr><td ' + styleAttr + '><b>DNS Reverse Lookup</b></td><td><i>Lookup failed</i></td></tr>';
                        }

                        // Add GeoIP info
                        if (countryCode) {
                            countryStr = (country ? country + ' (' + countryCode + ')' : country) || '';
                            regionStr = (region ? region + ' (' + regionCode + ')' : region) || '';
                            message += '<tr><td ' + styleAttr + '><b> Range </b></td><td>'
                                + (range ? range.join(' - ') : unknown) + '</td></tr>'
                                + '<tr><td ' + styleAttr + '><b> Country </b></td><td>'
                                + (countryStr || unknown) + '</td></tr>'
                                + '<tr><td ' + styleAttr + '><b> Region </b></td><td>'
                                + (regionStr || unknown) + '</td></tr>'
                                + '<tr><td ' + styleAttr + '><b> City </b></td><td>'
                                + (city || unknown) + '</td></tr>'
                                + '<tr><td ' + styleAttr + '><b> Lat./Long. </b></td><td><a href="http://maps.google.com/?q=' + latLong + '">'+ latLong + '</a></td></tr>';
                        }
                        else {
                            message += '<tr><td ' + styleAttr + '><b>GeoIP Lookup</b></td><td><i>Lookup failed</i></td></tr>';
                        }

                        message += '</table>';

                        // Add preview
                        var hiddenStyles = 'display:none !important;visibility:hidden;mso-hide:all;font-size:1px;'
                        + 'color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;';
                        message = '<div style="' + hiddenStyles + '">'
                            + ((city || unknown) + (regionCode ? ', ' + regionCode : '')
                               + (country ? ', ' + country : '')) + ' ' + (ip || '') + ' ' + (longDomain || '')
                            + '</div>' + message;

                        // Log to spreadsheet
                        logToSpreadsheet(
                            dateTime,
                            path,
                            ip || '',
                            domain || '',
                            longDomain || '',
                            entity || '',
                            crawler !== null ? crawler : '',
                            country || '',
                            countryCode || '',
                            region || '',
                            regionCode || '',
                            regionType || '',
                            city || '',
                            latLong || '',
                            range || ''
                        );

                        app.mail('info@ericwadkins.com', (crawler ? '(C) ' : '') + (countryCode ? '[' + countryCode + '] ' : '') + 'GeoIP Tracker - ericwadkins.com',
                                 message, true, function(success) {
                            if (!success) {
                                logger.error('Error sending GeoIP Tracker email. Results:');
                                logger.error(message);
                            }
                        });
                    });
                    
                });
            }, 0);
        }
        next();
    });
    
    function logToSpreadsheet(dateTime, path, ip, domain, longDomain, entity, crawler, country, countryCode, region, regionCode, regionType, city, latLong, range) {
        // GeoIP Tracker submission function
        var formid = process.env.FORM_ID;
        if (formid) {
            var data = {
                "entry.1395352981": dateTime,
                "entry.533438788": path,
                "entry.1818755280": ip,
                "entry.1547476546": domain,
                "entry.1208339100": longDomain,
                "entry.950158622": entity,
                "entry.421791136": crawler,
                "entry.1499749132": country,
                "entry.678326523": countryCode,
                "entry.1839257608": region,
                "entry.520002102": regionCode,
                "entry.1705355953": regionType,
                "entry.169013684": city,
                "entry.966262772": latLong,
                "entry.1517919849": range
            };
            var params = [];
            for (key in data) {
                params.push(key + "=" + encodeURIComponent(data[key]));
            }
            var url = "https://docs.google.com/forms/d/" + formid + "/formResponse?" + params.join("&");
            console.log(url);
            request(url, function (error, response, body) {
            });
        }
    }
    
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
	app.use('/analytics', require(path.join(__dirname, config.server.routesDirectory, 'analytics'))(db, logger));
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
