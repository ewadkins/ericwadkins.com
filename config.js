var fs = require('fs')

var config = {
		server: {
			port: 80,
			useHttps: false,
			https: {
				keyPath: '',
				certPath: ''
			},
			appDirectory: __dirname,
			publicDirectory: 'public',
			routesDirectory: 'routes',
			logDirectory: 'logs',
			index: 'index.html'
		},    
		db: {
			hostname: 'ds059165.mongolab.com',
	        port: 59165,
	        mainDb: 'heroku_h5zdpd40',
	        useSSL: false,
	        required: true,
	        authenticate: true,
	        authentication: {
	            username: 'admin',
	            password: fs.readFileSync('password.txt').toString()
	        },
	        collections: {
	        	users: 'users',
	        	active: 'active',
	        	pending: 'pending',
	        	inactive: 'inactive',
	        	oauthAccessTokens: 'oauthAccessTokens'
	        }
	    },
	    
	    remindDelayHours: 24,
	    
	    appClientId: 'app',
	    appClientSecret: 'd0gd4ys',
	    
	    array: array,
	    object: object
}

function array(contents) {
	return {
		type: 'array',
		contents: contents
	}
}

function object(contents) {
	return {
		type: 'object',
		contents: contents
	}
}

module.exports = config;