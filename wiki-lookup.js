var request = require('request');
var cheerio = require('cheerio');

module.exports = function(title, callback) {
    if (title) {
        var url = 'https://wikipedia.org/wiki/' + title;
        try {
            request(url, function(err, res, body) {
                var $ = cheerio.load(body);
                if ($.text().indexOf('Wikipedia does not have an article with this exact name') !== -1
                    || $.text().indexOf('may refer to:') !== -1
                    || $.text().indexOf('is the abbreviation of:') !== -1) {
                    return callback(null);
                }
                var desc = null;
                try {
                    desc = $('#mw-content-text > p').first().text().replace(/\[[0-9]+\]/g, '');
                } finally {
                    callback(desc);
                }
            });
        } catch(err) {
            callback(null);
        }
    }
    else {
        callback(null);
    }
}