var config = require('../config');
var express = require('express');
var router = express.Router();

module.exports = function(db, logger){

	router.post('/', function(req, res, next) {
		var document = app.buildDocument(req.body, { name: 'string', phone: 'string', email: 'string', message: 'string' });
        var message = 'Name: ' + document.name + '\n'
                    + 'Email: ' + document.email + '\n'
                    + (document.phone ? 'Phone: ' + document.phone + '\n' : '') + '\n'
                    + 'Message:\n\n' + document.message;
        app.mail('info@ericwadkins.com', 'Contact Form - ericwadkins.com', message, false, function(success) {
            res.status(success ? 200 : 500);
            res.end();
        });
	});
	
	return router;
}
