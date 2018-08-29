var config = require('../config');
var express = require('express');
var router = express.Router();
var lookup = require('../lookup');
var wiki = require('../wiki-lookup');

module.exports = function(db, logger){

	/*router.post('/', function(req, res, next) {
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
                    + (document.phone ? 'Phone: ' + document.phone + '<br>' : '') + '<br>'
                    + 'Message:<br><br>' + document.message;
            
            app.mail('info@ericwadkins.com', 'Contact Form - ericwadkins.com', message, true, function(success) {
                res.status(success ? 200 : 500);
                res.end();
                if (!success) {
                    logger.error('Error sending Contact Form email. Results:');
                    logger.error(message);
                }
            });
        });
	});*/
    
    router.post('/', function(req, res, next) {
		var document = app.buildDocument(req.body, { name: 'string', phone: 'string', email: 'string', message: 'string' });
        
        // Get ip
        var ips = req.headers["X-Forwarded-For"]
                                    || req.headers["x-forwarded-for"]
                                    || req.client.remoteAddress
                                    || '';
        var singleIp = ips;
        var parts = ips.split(',');
        if (parts.length > 1) {
            singleIp = parts[0].trim();
        }
        
        var path = req.path;
        
        // Never block the request
        setTimeout(function() {

            lookup(singleIp, function(data) {
                var ip = ips;
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
                var continent = data.continent;
                var subcontinent = data.subcontinent;

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
                    }
                    else {
                        message += '<tr><td ' + styleAttr + '><b>DNS Reverse Lookup</b></td><td><i>Lookup failed</i></td></tr>';
                    }
                    if (entity) {
                        message += '<tr><td ' + styleAttr + '><b> Entity </b></td><td>'
                            + (entity || unknown) + '</td></tr>';
                    }
                    message += '<tr><td ' + styleAttr + '><b> Crawler? </b></td><td>'
                        + (crawler ? 'Yes' : 'No') + '</td></tr>';
                    if (domain) {
                        // Add wiki description
                        message += '<tr><td ' + styleAttr + '><b>Description</b></td><td>'
                            + description + '</td></tr>';
                    }

                    // Add GeoIP info
                    if (countryCode) {
                        countryStr = (country ? country + ' (' + countryCode + ')' : countryCode) || '';
                        regionStr = (region ? region + ' (' + regionCode + ')' : regionCode) || '';
                        message += '<tr><td ' + styleAttr + '><b> Range </b></td><td>'
                            + (range ? range.join(' - ') : unknown) + '</td></tr>'
                            + '<tr><td ' + styleAttr + '><b> Country </b></td><td>'
                            + (countryStr || unknown) + '</td></tr>'
                            + '<tr><td ' + styleAttr + '><b> Region </b></td><td>'
                            + (regionStr || unknown) + '</td></tr>'
                            + '<tr><td ' + styleAttr + '><b> City </b></td><td>'
                            + (city || unknown) + '</td></tr>'
                            + '<tr><td ' + styleAttr + '><b> Lat./Long. </b></td><td><a href="http://maps.google.com/?q=' + latLong + '">'+ latLong + '</a></td></tr>'
                                + '<tr><td ' + styleAttr + '><b> Continent </b></td><td>'
                                + (continent || unknown) + '</td></tr>'
                                + '<tr><td ' + styleAttr + '><b> Subcontinent </b></td><td>'
                                + (subcontinent || unknown) + '</td></tr>';
                    }
                    else {
                        message += '<tr><td ' + styleAttr + '><b>GeoIP Lookup</b></td><td><i>Lookup failed</i></td></tr>';
                    }

                    message += '</table>';
            
                    message += '<br>Name: ' + document.name + '<br>'
                            + 'Email: ' + document.email + '<br>'
                            + (document.phone ? 'Phone: ' + document.phone + '<br>' : '') + '<br>'
                            + 'Message:<br><br>' + document.message;

                    // Add preview
                    var hiddenStyles = 'display:none !important;visibility:hidden;mso-hide:all;font-size:1px;'
                    + 'color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;';
                    message = '<div style="' + hiddenStyles + '">'
                        + ((city || unknown) + (regionCode ? ', ' + regionCode : '')
                           + (country ? ', ' + country : '')) + ' ' + (ip || '') + ' ' + (longDomain || '')
                        + '</div>' + message;

                    app.mail('info@ericwadkins.com', (crawler ? '(C) ' : '') + (countryCode ? '[' + countryCode + (countryCode === 'US' && regionCode ? ':' + regionCode : '') + '] ' : '') + 'Contact Form - ericwadkins.com', message, true, function(success) {
                        res.status(success ? 200 : 500);
                        res.end();
                        if (!success) {
                            logger.error('Error sending Contact Form email. Results:');
                            logger.error(message);
                        }
                    });
                });

            });
        }, 0);
        
    });
	
	return router;
}