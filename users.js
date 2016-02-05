var config = require('./config');
var mongodb = require('mongodb');
var bcrypt = require('bcrypt');

var logger;

// If required from another file
if (!process.argv[1] || process.argv[1].indexOf(__filename.substr(0, __filename.indexOf('.'))) === -1) {
	module.exports = function(db, _logger) {
		logger = {
				info: function(msg) { _logger.info(msg) },
				error: function(msg) { _logger.error(msg) }
		};
		return getFunctions(db, logger);
	}
}
else {
	logger = {
			info: function(msg) { console.log(msg) },
			error: function(msg) { console.error(msg) }
	}
	connect(function(db) {
		var functions = getFunctions(db, logger);
		if (process.argv[2] && process.argv[2].toLowerCase() === 'list') {
			functions.list(done);
		}
		else if (process.argv[2] && process.argv[2].toLowerCase() === 'get' && process.argv[3]) {
			functions.get(process.argv[3], done);
		}
		else if (process.argv[2] && process.argv[2].toLowerCase() === 'add' && process.argv[3]) {
			functions.add(process.argv[3], process.argv[4] ? process.argv[4] : 'password', process.argv[5] ? process.argv[5] : 'John', process.argv[6] ? process.argv[6] : 'Smith', done);
		}
		else if (process.argv[2] && process.argv[2].toLowerCase() === 'remove' && process.argv[3]) {
			functions.remove(process.argv[3], done);
		}
		else if (process.argv[2] && process.argv[2].toLowerCase() === 'removeall') {
			functions.removeAll(done);
		}
		else if (process.argv[2] && process.argv[2].toLowerCase() === 'setpassword' && process.argv[3] && process.argv[4]) {
			functions.setPassword(process.argv[3], process.argv[4], done);
		}
		else {
			console.log('\'node users list\' - list all users');
			console.log('\'node users get <username>\' - displays info on a user');
			console.log('\'node users add <username> [password] [firstName] [lastName]\' - creates a new user');
			console.log('\'node users remove <username>\' - removes a user');
			console.log('\'node users removeAll\' - removes all users');
			console.log('\'node users setPassword <username> <password>\' - resets a user\'s password');
			done();
		}
		
		function done() {
			db.close();
		}
	});
}

function connect(callback) {
	var MongoClient = mongodb.MongoClient;
	var dburi = 'mongodb://' + config.db.hostname + ':' + config.db.port + '/' + config.db.mainDb;
	MongoClient.connect(dburi, { server: { ssl: config.db.useSSL, sslValidate: false } }, function (err1, db) {
		if (err1) {
			console.error(err1.toString());
		}
		else {
			if (config.db.authenticate) {
				db.authenticate(config.db.authentication.username, config.db.authentication.password, function (err2) {
					if (err2) {
						console.error(err2.toString());
					}
					else {
						callback(db);
					}
				});
			}
			else {
				callback(db);
			}
		}
	});
}

function getFunctions(db, logger) {
	
	function list(callback) {
		db.collection(config.db.collections.users).find({}).toArray(function(err, results) {
			if (err) {
				logger.error(err.toString());
			}
			else {
				for (var i = 0; i < results.length; i++) {
					logger.info(results[i].username);
				}
			}
			if (callback) {
				callback();
			}
		});
	}
	
	function get(username, callback) {
		db.collection(config.db.collections.users).find({ username: username }).toArray(function(err, results) {
			if (err) {
				logger.error(err.toString());
			}
			else if (results && results.length) {
				logger.info(results[0]);
			}
			if (callback) {
				callback();
			}
		});
	}

	function add(user, password, firstName, lastName, callback) {
		var userData = new UserData(user, password, firstName, lastName);
		db.collection(config.db.collections.users).findOne({ username: user }, function(err, result) {
			if (!result) {
				db.collection(config.db.collections.users).insert(userData, function(err) {
					if (err) {
						logger.error(err.toString());
					}
					else {
						logger.info('Added user ' + user);
					}
					if (callback) {
						callback();
					}
				});
			}
			else {
				logger.error('User ' + user + ' already exists');
				if (callback) {
					callback();
				}
			}
		});
	}

	function remove(user, callback) {
		db.collection(config.db.collections.users).findOne({ username: user }, function(err, result) {
			if (result) {
				db.collection(config.db.collections.users).remove({ username: user }, function(err) {
					if (err) {
						logger.error(err.toString());
					}
					else {
						logger.info('Removed user ' + user);
					}
					if (callback) {
						callback();
					}
				});
			}
			else {
				logger.error('User ' + user + ' doesn\'t exist');
				if (callback) {
					callback();
				}
			}
		});
	}

	function removeAll(callback) {
		db.collection(config.db.collections.users).remove({}, function(err) {
			if (err) {
				logger.error(err.toString());
			}
			else {
				logger.info('Removed all users');
			}
			if (callback) {
				callback();
			}
		});
	}

	function setPassword(user, password, callback) {
		var salt = bcrypt.genSaltSync(10);
	    var hash = bcrypt.hashSync(password, salt);
		db.collection(config.db.collections.users).update({ username: user }, { $set: { password: hash } }, function(err) {
			if (err) {
				logger.error(err.toString());
			}
			else {
				logger.info('Password set');
			}
			if (callback) {
				callback();
			}
		});
	}

	return {
			list: list,
			get: get,
			add: add,
			remove: remove,
			removeAll: removeAll,
			setPassword: setPassword
	}
}

function UserData(username, password, firstName, lastName) {
	var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
	this.username = username;
	this.password = hash;
	this.firstName = firstName;
	this.lastName = lastName;
}
