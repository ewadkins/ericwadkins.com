var config = require('./config');
var bcrypt = require('bcrypt');

module.exports = function(db, logger) {

	function getAccessToken(bearerToken, callback) {
		db.collection(config.db.collections.oauthAccessTokens).find({ accessToken: bearerToken }, { notifications: 0 }).toArray(function(error, results) {
			if (error) {
				logger.error(error);
				callback(error);
			}
			else if (!results.length) {
				logger.info('Access token not found');
				callback(null);
			}
			else {
				logger.info('Access token found');
				var token = results[0];
				callback(null, {
					accessToken: token.accessToken,
					clientId: token.clientId,
					expires: token.expires,
					userId: token.user
				});
			}
		});
	}
	
	function getClient(clientId, clientSecret, callback) {
		if (clientId === config.appClientId) {
			if (clientSecret === config.appClientSecret) {
				return callback(null, { clientId: config.appClientId, clientSecret: config.appClientSecret });
			}
		}
		callback(null);
	}
	
	function grantTypeAllowed(clientId, grantType, callback) {
		if (grantType === 'password' && clientId === config.appClientId) {
			logger.info('Accepted ' + grantType + ' grant request from client ' + clientId);
			return callback(false, true);
		}
		logger.info('Rejected ' + grantType + ' grant request from client ' + clientId);
		callback(false, false);
	}
	
	function saveAccessToken(accessToken, clientId, expires, user, callback) {
		db.collection(config.db.collections.oauthAccessTokens).insert({ accessToken: accessToken, clientId: clientId, expires: expires, user: user }, function(error) {
			if (error) {
				logger.error(error);
			}
			else {
				logger.info('Access token saved');
			}
			callback(error);
		});
	}
	
	function getUser(username, password, callback) {
		db.collection(config.db.collections.users).find({ username: username }).toArray(function(error, results) {
			if (error) {
				logger.error(error);
				callback(error);
			}
			else if (!results.length || !bcrypt.compareSync(password, results[0].password)) {
				logger.info('User not found or invalid password');
				callback(null, false);
			}
			else {
				logger.info('User found');
				callback(null, results[0]);
			}
		});
	}
	
	return {
			getAccessToken: getAccessToken,
			getClient: getClient,
			grantTypeAllowed: grantTypeAllowed,
			saveAccessToken: saveAccessToken,
			getUser: getUser
	};
}