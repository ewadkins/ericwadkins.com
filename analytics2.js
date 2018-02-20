var request = require('request');
var csv = require('parse-csv');
var parseDomain = require('parse-domain');
require('dotenv').config();

var unknown = '(unknown)';

var data = null;
var dataTimestamp = new Date(0);
var dataExpirationSeconds = 60;

module.exports = { getAnalysis: getAnalysis, getData: getData };

var url = process.env.FORM_DATA_URL;

var dataLabels = {
    timestamp: 'timestamp',
    date: 'date/time',
    path: 'path',
    ip: 'ip',
    domain: 'domain',
    longDomain: 'long domain',
    entity: 'entity',
    crawler: 'crawler?',
    country: 'country',
    countryCode: 'country code',
    region: 'region',
    regionCode: 'region code',
    regionType: 'regionType',
    city: 'city',
    latLong: 'lat./long.',
    range: 'range'
};

function filter(obj, args) {
    var filtered = false;
    for (var key in args) {
        if (args.hasOwnProperty(key)) {
            if ((obj[key] !== undefined) && obj[key].toString().toLowerCase()
                    .indexOf(args[key].toLowerCase()) === -1) {
                filtered = true;
                break;
            }
        }
    }
    return !filtered;
}

function getData(args, callback) {
    getAllData(function(data) {
        callback(data.filter(x => filter(x, args)));
    });
}

function getAllData(callback) {
    if ((new Date().getTime() - dataTimestamp.getTime()) / 1000 >= dataExpirationSeconds) {
        //console.log('Fetching data..')
        request(url, function (error, response, body) {
            dataTimestamp = new Date();
            var rows = csv.toJSON(body, { headers: { included: true } });
            var parsed = [];
            for (var i = 0; i < rows.length; i++) {
                var obj = {};
                for (var label in dataLabels) {
                    if (dataLabels.hasOwnProperty(label)) {
                        obj[label] = rows[i][dataLabels[label]];
                    }
                }

                // Make changes for analysis
                obj.date = new Date(obj.date);

                // New fields
                obj.date_second = roundDate(obj.date, 'second');
                obj.date_minute = roundDate(obj.date, 'minute');
                obj.date_hour = roundDate(obj.date, 'hour');
                obj.date_day = roundDate(obj.date, 'day');
                obj.date_week = getMonday(roundDate(obj.date, 'day'));
                obj.date_month = roundDate(obj.date, 'month');
                obj.date_year = roundDate(obj.date, 'year');
                obj.second = obj.date.getSeconds();
                obj.minute = obj.date.getMinutes();
                obj.hour = obj.date.getHours();
                obj.day = obj.date.getDay();
                obj.dayOfMonth = obj.date.getDate();
                obj.week = getWeekNumber(obj.date);
                obj.month = obj.date.getMonth();
                obj.year = obj.date.getFullYear();
                obj.cityRegionCountry = (obj.city || unknown) + ((obj.region || obj.regionCode) ? ', ' + (obj.region || obj.regionCode) : '') + ((obj.country || obj.countryCode) ? ', ' + (obj.country || obj.countryCode) : '');
                obj.regionCountry = ((obj.region || obj.regionCode) || unknown) + ((obj.country || obj.countryCode) ? ', ' + (obj.country || obj.countryCode) : '');

                // Modify existing fields
                obj.ip = obj.ip || unknown;
                obj.domain = obj.domain || unknown;
                obj.longDomain = obj.longDomain || unknown;
                obj.entity = obj.entity || unknown;
                obj.crawler = obj.crawler.toLowerCase() === 'true';
                obj.country = obj.country || unknown;
                obj.countryCode = obj.countryCode || unknown;
                obj.region = obj.region || unknown;
                obj.regionCode = obj.regionCode || unknown;
                obj.regionType = obj.regionType || unknown;
                obj.city = obj.city || unknown;
                obj.latLong = obj.latLong || unknown;
                obj.range = obj.range || unknown;

                parsed.push(obj);
            }

            evaluateKnownStay(parsed.sort((a, b) => a.date - b.date));

            // Modify existing fields
            for (var i = 0; i < parsed.length; i++) {
                parsed[i].knownSessionLength = parsed[i].knownSessionLength || unknown;
            }
            
            data = parsed;
            callback(data);
        });
    } else {
        callback(data);
    }
}

function evaluateKnownStay(ordered) {
    var count = 1;
    var lastIp = ordered[0];
    for (var i = 0; i < ordered.length; i++) {
        ordered[i].knownSessionLength = null;
        ordered[i].sessionEventCount = 1;
    }
    for (var i = 1; i < ordered.length + 1; i++) {
        if (i < ordered.length && lastIp === ordered[i].ip) {
            count++;
        } else {
            if (count > 1) {
                span = (ordered[i-1].date.getTime() - ordered[i-count].date.getTime()) / 1000.0;
                for (var j = i-count; j < i; j++) {
                    ordered[j].knownSessionLength = span;
                    ordered[j].sessionEventCount = count;
                }
            }
            if (i < ordered.length) {
                lastIp = ordered[i].ip;
            }
            count = 1;
        }
    }
}

function getAnalysis(args, callback) {
    getData(args, function(data) {
        callback(analyze(data));
    });
}

var dateFields = new Set(['date', 'date_day', 'date_hour', 'date_minute', 'date_month', 'date_second', 'date_week', 'date_year'])

function analyze(parsed) {
    var results = {
        data: parsed,
        count: parsed.length,
    };
    
    results.minDate = new Date();
    results.maxDate = new Date(0);
    for (var i = 0; i < parsed.length; i++) {
        if (parsed[i].date < results.minDate) {
            results.minDate = parsed[i].date;
        }
        if (parsed[i].date > results.maxDate) {
            results.maxDate = parsed[i].date;
        }
    }
    
    results.counts = {};
    var countFieldMap = {};
    for (var field in parsed[0]) {
        if (parsed[0].hasOwnProperty(field)) {
            countFieldMap[field] = field;
        }
    }
    countFieldMap.city = 'cityRegionCountry';
    countFieldMap.region = 'regionCountry';
    delete countFieldMap.cityRegionCountry;
    delete countFieldMap.regionCountry;
    
    for (var countField in countFieldMap) {
        if (countFieldMap.hasOwnProperty(countField)) {
            var countMap = {};
            for (var i = 0; i < parsed.length; i++) {
                if (!countMap[parsed[i][countFieldMap[countField]]]) {
                    countMap[parsed[i][countFieldMap[countField]]] = 0;
                }
                countMap[parsed[i][countFieldMap[countField]]] += 1;
            }
            //results.counts[countField] = sortObjectByValue(countMap);
            results.counts[countField] = mapToSortedTuples(countMap, dateFields.has(countField));
        }
    }
    
    for (var field in results.counts.sessionEventCount) {
        if (results.counts.sessionEventCount.hasOwnProperty(field)) {
            results.counts.sessionEventCount[field] =
                results.counts.sessionEventCount[field] / parseInt(field)
        }
    }
    
    return results;
}

function sortObjectByValue(obj) {
    var valueKeyPairs = [];
    for (var field in obj) {
        if (obj.hasOwnProperty(field)) {
            valueKeyPairs.push([obj[field], field]);
        }
    }
    valueKeyPairs.sort((a, b) => a[0] - b[0]);
    valueKeyPairs.reverse();
    var newObj = {};
    for (var i = 0; i < valueKeyPairs.length; i++) {
        newObj[valueKeyPairs[i][1]] = valueKeyPairs[i][0];
    }
    return newObj;
}
function mapToSortedTuples(obj, isDate) {
    var valueKeyPairs = [];
    for (var field in obj) {
        if (obj.hasOwnProperty(field)) {
            valueKeyPairs.push([isDate ? new Date(field) :
                                (isNaN(field) ? field : parseFloat(field)), obj[field]]);
        }
    }
    valueKeyPairs.sort((a, b) => a[0] - b[0]);
    return valueKeyPairs;
}

function roundDate(date, order) {
    orders = ['second', 'minute', 'hour', 'day', 'month', 'year'];
    index = orders.indexOf(order);
    date = new Date(date);
    if (index >= 0) {
        date.setMilliseconds(0);
    }
    if (index >= 1) {
        date.setSeconds(0);
    }
    if (index >= 2) {
        date.setMinutes(0);
    }
    if (index >= 3) {
        date.setHours(0);
    }
    if (index >= 4) {
        date.setDate(1);
    }
    if (index >= 5) {
        date.setMonth(0);
    }
    return date
}

function getMonday(date) {
    date = new Date(date);
    var day = date.getDay();
    var diff = date.getDate() - day + (day == 0 ? -6:1);
    return new Date(date.setDate(diff));
}

function getWeekNumber(date) {
    var onejan = new Date(date.getFullYear(),0,1);
    var millisecsInDay = 86400000;
    return Math.ceil((((date - onejan) /millisecsInDay) + onejan.getDay()+1)/7);
};