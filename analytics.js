var request = require('request');
var csv = require('parse-csv');
var parseDomain = require('parse-domain');
var chalk = require('chalk');
chalk.enabled = true; // Force enable
var Convert = require('ansi-to-html');
var convert = new Convert();
require('dotenv').config();

module.exports = { run: function(argv, callback) {
    var args = {};
    for (var key in argv) {
        if (argv.hasOwnProperty(key)) {
            args[argAliases[key] || key] = argv[key];
        }
    }
    run(args, function(output) {
        // Returns html output
        var bootstrapCss = '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">';
        var bootstrapJs = '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>';
        var style = '<style>body{background:black;font-family:monospace;font-size:9pt} .row{margin-left:15px;margin-right:15px;margin-top:15px;margin-bottom:15px} .data div{padding:15px;background:#101010;max-height:35000px;overflow-y:auto;overflow-x:hidden} .data{margin-top:15px;margin-bottom:15px} .header{margin:0px;margin-top:15px}</style>';
        var html = bootstrapJs + bootstrapCss + style;
        var parts = output.split('\n\n');
        
        html += '<div class="row"><div class="col-xs-12 data header"><div>';
        for (var i = 0; i < 2; i++) {
            if (i !== 0) {
                html += '<br>';
            }
            html += convert.toHtml(parts[i].trim().replace(/ /g, '&nbsp;').replace(/\n/g, '<br>'));
            html += '<br>';
        }
        html += '</div></div></div>';
        
        html += '<div class="row">';
        for (var i = 2; i < parts.length; i++) {
            html += '<div class="col-lg-4 col-md-6 col-sm-12 data"><div>'
            html += convert.toHtml(parts[i].trim().replace(/ /g, '&nbsp;').replace(/\n/g, '<br>').replace());
            html += '<br>';
            html += '</div></div>'
        }
        html += '</div>';
        
        callback(html);
    });
}};

var url = process.env.FORM_DATA_URL;

var argAliases = {
    cc: 'countryCode',
    state: 'region'
};

if (require.main === module) { // If called from command line directly
    var argv = process.argv.splice(2);
    var args = {};
    var filters = false;
    for (var i = 0; i < argv.length; i++) {
        var pieces = argv[i].split('=');
        if (pieces.length > 1) {
            var value = pieces.splice(1).join('=');
            args[argAliases[pieces[0]] || pieces[0]] = value;
            filters = true;
        }
        else {
            args[argv[i]] = null;
        }
    }

    run(args, function(output) {
        console.log(output.split('\n\n')[0])
        console.log(output);
    });
}

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

function run(args, callback) {
    request(url, function (error, response, body) {
        var rows = csv.toJSON(body, { headers: { included: true } });
        var unknown = '(unknown)';
        var parsed = [];
        for (var i = 0; i < rows.length; i++) {
            var obj = {};
            for (var label in dataLabels) {
                if (dataLabels.hasOwnProperty(label)) {
                    obj[label] = rows[i][dataLabels[label]];
                }
            }
            
            var filtered = false;
            for (var key in args) {
                if (args.hasOwnProperty(key)) {
                    if ((obj[key] !== undefined) && obj[key].toString().toLowerCase()
                            .indexOf(args[key].toLowerCase()) === -1) {
                        filtered = true;
                    }
                }
            }
            if (!filtered) {
                // Make changes for analysis and display
                
                // New fields
                obj.cityRegionCountry = (obj.city || unknown) + ((obj.region || obj.regionCode) ? ', ' + (obj.region || obj.regionCode) : '') + ((obj.country || obj.countryCode) ? ', ' + (obj.country || obj.countryCode) : '');
                obj.regionCountry = ((obj.region || obj.regionCode) || unknown) + ((obj.country || obj.countryCode) ? ', ' + (obj.country || obj.countryCode) : '');
                
                // Modify existing fields
                obj.date = new Date(obj.date);
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
        }
        var results = analyze(parsed, args);
        var output = display(results);
        
        callback(output);
    });
}


function analyze(parsed, args) {
    var results = {
        args: args,
        count: parsed.length,
    };
    var minDate = new Date();
    for (var i = 0; i < parsed.length; i++) {
        if (parsed[i].date < minDate) {
            minDate = parsed[i].date;
        }
    }
    results.minDate = minDate;
    results.counts = {};
    var countFieldMap = {
        city: 'cityRegionCountry',
        region: 'regionCountry',
        country: 'country',
        'crawler? (best guess)': 'crawler',
        domain: 'domain',
        //path: 'path',
    }
    for (var countField in countFieldMap) {
        if (countFieldMap.hasOwnProperty(countField)) {
            var countMap = {};
            for (var i = 0; i < parsed.length; i++) {
                if (!countMap[parsed[i][countFieldMap[countField]]]) {
                    countMap[parsed[i][countFieldMap[countField]]] = 0;
                }
                countMap[parsed[i][countFieldMap[countField]]] += 1;
            }
            results.counts[countField] = sortObjectByValue(countMap);
        }
    }
    return results;
}

function display(results) {
    var output = chalk.white('\r');
    
    // Filters
    for (var filter in results.args) {
        if (results.args.hasOwnProperty(filter)) {
            output += ('Filtering for ' + chalk.cyan(filter) + ' of ' + chalk.green(results.args[filter])) + '\n';
        }
    }
    
    // General stats
    output += ('Data since ' + chalk.magenta(results.minDate.toLocaleTimeString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric',
                                     minute: 'numeric', second: 'numeric' }))) + '\n';
    output += ('\n' + chalk.green('View count: ') + results.count) + '\n';
    
    if (results.count) {
        // Count display
        var countLabel = 'Views';
        var valueLength = 4;
        valueLength = valueLength < countLabel.length ? countLabel.length : valueLength;
        for (var countField in results.counts) {
            if (results.counts.hasOwnProperty(countField)) {
                var countStr = '';
                for (var i = 0; i < valueLength - countLabel.length; i++) {
                    countStr += ' ';
                }
                countStr += countLabel;
                output += ('\n' + chalk.green(countStr) + '  ' + chalk.cyan(countField.toUpperCase())) + '\n\t\n';
                for (var key in results.counts[countField]) {
                    if (results.counts[countField].hasOwnProperty(key)) {
                        var value = results.counts[countField][key];
                        var valueStr = '';
                        for (var i = 0; i < valueLength - value.toString().length; i++) {
                            valueStr += ' ';
                        }
                        valueStr += chalk.bold(value);
                        output += (valueStr + '  ' + key) + '\n';
                    }
                }
            }
        }
    }
    return output;
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