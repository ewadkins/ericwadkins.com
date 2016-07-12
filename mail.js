
module.exports = mail;

var fs = require('fs');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: 'noreply8345@gmail.com',
		pass: 'idontcare12345' // Don't care if this is public, enjoy github
	}
});

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
				console.log('Message sent: ' + info.response);
			}
			if (callback) {
				callback(successful);
			}
		});
	}
}
