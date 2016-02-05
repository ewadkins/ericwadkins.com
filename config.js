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
			hostname: 'localhost',
	        port: 27017,
	        mainDb: 'iou',
	        useSSL: false,
	        required: true,
	        authenticate: false,
	        authentication: {
	            username: '',
	            password: ''
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