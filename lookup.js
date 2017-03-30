var dns = require('dns');
var parseDomain = require('parse-domain');
var geoip = require('geoip-lite');
var iso3166 = require('iso-3166-2');

process.env.TZ = 'America/New_York';

module.exports = function(val, callback) {
    
    var domain, ip;
    if (/[a-zA-Z]/.test(val)) { // is not an ip, assume domain name
        domain = val;
    }
    else {
        ip = val;
    }
    
    if (domain) {
        dnsLookup(domain, function(err, ip) {
            if (err) {
                return callback({});
            }
            console.log(ip);
            geoLookup(ip, function(geo) {
                return analyze(ip, domain, geo, callback);
            });
        });
    }
    else {
        geoLookup(ip, function(geo) {
            reverseDnsLookup(ip, function(err, domain) {
                if (err) {
                    return callback({});
                }
                return analyze(ip, domain, geo, callback);
            });
        });
    }
    
}

function analyze(ip, domain, geo, callback) {
    
    // Domain parsing
    var longDomain, domain, entity, crawler = false;
    
    var parsed = domain ? parseDomain(domain) : {};
    longDomain = parsed ? [parsed.subdomain, parsed.domain, parsed.tld]
        .filter(n => n).join('.') : domains[0];
    domain = parsed ? [parsed.domain, parsed.tld]
        .filter(n => n).join('.') : null;
    entity = parsed ? parsed.domain.toUpperCase() : null;
    crawler = /(crawl|spider|bot)[\.-]/.test(domain);

    // GeoIP lookup
    var country, countryCode, region, regionCode, regionType, city, latlong, range;
    
    geo = geo || {};
    countryCode = geo.country || null;
    var countryObj = {};
    if (countryCode) {
        countryObj = iso3166.country(countryCode);
    }
    countryCode = countryObj.code || countryCode; // Refine country code
    country = countryObj.name || null;
    regionCode = geo.region || null;
    var regionObj = {};
    if (regionCode && countryCode) {
        regionObj = iso3166.subdivision(countryCode, regionCode);
    }
    regionCode = regionObj.regionCode || regionCode; // Refine region code
    region = regionObj.name || null;
    regionType = regionObj.type ? regionObj.type.toLowerCase() : null;
    city = geo.city || null;
    range = geo.range || null;
    if (range && range.length === 2) {
        range[0] = geoip.pretty(range[0]);
        range[1] = geoip.pretty(range[1]);
    }
    latlong = geo.ll || null;

    callback({
        ip: ip,
        domain: domain,
        longDomain: longDomain,
        entity: entity,
        crawler: crawler,
        country: country,
        countryCode: countryCode,
        region: region,
        regionCode: regionCode,
        regionType: regionType,
        city: city,
        latlong: latlong,
        range: range
    });
}

function geoLookup(ip, callback) {
    var geo = geoip.lookup(ip);
    var ipv4Index = ip.search(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/);
    if (ipv4Index !== -1) {
        ip = ip.slice(ipv4Index) || ip;
        if (!geo) {
            geo = geoip.lookup(ip);
        }
    }
    callback(geo);
}

function dnsLookup(domain, callback) {
    dns.lookup(domain, function(err, ip) {
        if (err !== null) {
            callback(err, null);
        }
        else {
            callback(null, ip);
        }
   });
}
    
function reverseDnsLookup(ip, callback) {
    dns.reverse(ip, function(err, domains) {
        if (err !== null) {
            callback(err, null);
        }
        else {
            callback(null, domains[0]);
        }
   });
}