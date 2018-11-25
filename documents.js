var config = require('./config');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var bcrypt = require('bcryptjs');

module.exports = function(db, logger) {
	
	db.ObjectID = ObjectID;
	
	function find(collection, query, callback) {
		db.collection(collection).find(query).toArray(function(err, results) {
			if (err) {
				logger.error(err.toString());
				if (callback) {
					callback(null, { error: err.toString() })
				}
			}
			else {
				logger.info('Found documents');
				if (callback) {
					callback(results, null);
				}
			}
		});
	}

	function add(collection, document, callback) {
		db.collection(collection).insert(document, function(err, results) {
			if (err) {
				logger.error(err.toString());
				if (callback) {
					callback(false, { error: err.toString() });
				}
			}
			else {
				logger.info('Added document');
				if (callback) {
					callback(true, null);
				}
			}
		});
	}

	function remove(collection, query, callback) {
		db.collection(collection).remove(query, function(err, results) {
			if (err) {
				logger.error(err.toString());
				if (callback) {
					callback(false, { error: err.toString() });
				}
			}
			else if (!results.result.n) {
				logger.info('No matching document found');
				if (callback) {
					callback(false, { error: 'No matching document found' });
				}
			}
			else {
				logger.info('Removed document');
				if (callback) {
					callback(true, null);
				}
			}
		});
	}

	function edit(collection, query, edits, callback) {
		db.collection(collection).update(query, { $set: edits }, function(err, results) {
			if (err) {
				logger.error(err.toString());
				if (callback) {
					callback(false, { error: err.toString() });
				}
			}
			else if (!results.result.n) {
				logger.info('No matching document found');
				if (callback) {
					callback(false, { error: 'No matching document found' });
				}
			}
			else {
				logger.info('Modified document');
				if (callback) {
					callback(true, null);
				}
			}
		});
	}

	return {
			find: find,
			add: add,
			edit: edit,
			remove: remove,
	}
}
