var config = require('../config');
var express = require('express');
var router = express.Router();
var geoip = require('geoip-lite');
var dns = require('dns');

module.exports = function(db, logger){

	router.post('/', function(req, res, next) {
		var document = app.buildDocument(req.body, { name: 'string', phone: 'string', email: 'string', message: 'string' });
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
            var message = '<table>';
            var styleAttr = 'style="padding-right:10px"';
            var unknown = '(unknown)';
            var datetime = new Date().toLocaleTimeString('en-US',
                            { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric',
                             minute: 'numeric', second: 'numeric', timeZoneName: 'short', hour12: true });
            message += '<tr><td ' + styleAttr + '><b> IP Address </b></td><td>' + geoip.pretty(ip) + '</td></tr>'
                + '<tr><td ' + styleAttr + '><b> Date/Time </b></td><td>'
                + datetime
                + '</td></tr>';
            var crawler = false;
            if (!err && domains && domains.length) {
                message += '<tr><td ' + styleAttr + '><b> DNS Reverse Lookup </b></td><td>' + domains + '</td></tr>';
                for (var d = 0; d < domains.length; d++) {
                    if (/(crawl|spider|bot)[\.-]/.test(domains[d])) {
                        crawler = true;
                        break;
                    }
                }
            }
            else {
                message += '<tr><td ' + styleAttr + '><b>DNS Reverse Lookup</b></td><td><i>Lookup failed</i></td></tr>';
            }
            var country, region, city, range, ll;
            if (geo) {
                country = ((countries[geo.country] ? countries[geo.country]
                                + ' (' + geo.country + ')' : geo.country) || '');
                region = geo.region || '';
                city = geo.city || '';
                range = geo.range || '';
                ll = geo.ll || '';
                message += '<tr><td ' + styleAttr + '><b> Range </b></td><td>' + (range || unknown) + '</td></tr>'
                    + '<tr><td ' + styleAttr + '><b> Country </b></td><td>' + (country || unknown) + '</td></tr>'
                    + '<tr><td ' + styleAttr + '><b> Region </b></td><td>' + (region || unknown) + '</td></tr>'
                    + '<tr><td ' + styleAttr + '><b> City </b></td><td>' + (city || unknown) + '</td></tr>'
                    + '<tr><td ' + styleAttr + '><b> Latitude/Longitude </b></td><td><a href="http://maps.google.com/?q=' + ll + '">' + ll + '</a></td></tr>';
            }
            else {
                message += '<tr><td colspan="0"> GeoIP lookup failed </td></tr>';
            }
            message += '</table>';
            
            message += '<br>Name: ' + document.name + '<br>'
                    + 'Email: ' + document.email + '<br>'
                    + (document.phone ? 'Phone: ' + document.phone + '<br>' : '') + '<br>';
            app.mail('info@ericwadkins.com', 'Contact Form - ericwadkins.com', message, true, function(success) {
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