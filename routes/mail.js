var config = require('../config');
var express = require('express');
var router = express.Router();
var geoip = require('geoip-lite');
var dns = require('dns');

module.exports = function(db, logger){

	router.post('/', function(req, res, next) {
		var document = app.buildDocument(req.body, { name: 'string', phone: 'string', email: 'string', message: 'string' });
        var message = 'Name: ' + document.name + '\n'
                    + 'Email: ' + document.email + '\n'
                    + (document.phone ? 'Phone: ' + document.phone + '\n' : '') + '\n';
        var ip = req.headers["X-Forwarded-For"]
                                        || req.headers["x-forwarded-for"]
                                        || req.client.remoteAddress
                                        || '';
        var geo = geoip.lookup(ip);
        var ipv4Index = ip.search(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/);
        if (ipv4Index !== -1) {
            ip = ip.slice(ipv4Index);
            if (!geo) {
                geo = geoip.lookup(ip);
            }
        }
        reverseLookup(ip, function(err, domains) {
            message += 'IP: ' + geoip.pretty(ip) + '\n'
                        + 'Date/Time: ' + new Date() + '\n';
            if (!err && domains && domains.length) {
                message += 'DNS Reverse Lookup: ' + domains + '\n';
            }
            else {
                message += 'DNS reverse lookup failed\n';
            }
            if (geo) {
                message += 'Range: ' + geo.range + '\n'
                    + 'Country: ' + geo.country + '\n'
                    + 'Region: ' + geo.region + '\n'
                    + 'City: ' + geo.city + '\n'
                    + 'Latitude/Longitude: ' + geo.ll + '\n';
            }
            else {
                message += 'GeoIP lookup failed\n';
            }
            message += '\nMessage:\n\n' + document.message;
            app.mail('info@ericwadkins.com', 'Contact Form - ericwadkins.com', message, false, function(success) {
                res.status(success ? 200 : 500);
                res.end();
                if (!success) {
                    logger.error('Error sending Contact Form email. Results:');
                    logger.error(message);
                }
            });
        });
	});
	
	return router;
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