
module.exports = mail;

var fs = require('fs');
var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

var transporter = nodemailer.createTransport(
    mg({
        auth: {
            api_key: process.env.MAILGUN_KEY || '0',
            domain: 'mg.ericwadkins.com'
        }
    })
);

function mail(to, subject, message, isHtml, callback) {
	if (Array.isArray(to)) {
		var i = 0;
		next();
		function next() {
			if (i < to.length) {
				mail(to[i], subject, message, isHtml, function(successful) {
					if (successful) {
						i++;
					}
					next();
				});
			}
			else {
				if (callback) {
					callback();
				}
			}
		}
	}
	else {
		var mailOptions = {
                from: 'eric@ericwadkins.com',
				to: to,
				subject: subject,
				text: message,
		};
		if (isHtml) {
			mailOptions.html = message;
		}
		transporter.sendMail(mailOptions, function(error, info){
			var successful = true;
			if (error) {
				console.log(error);
				successful = false;
			}
			else {
				console.log('Message sent: ' + JSON.stringify(info));
			}
			if (callback) {
				callback(successful);
			}
		});
	}
}
