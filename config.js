var config = {
		server: {
			port: 80,
			useHttps: false,
			https: {
				keyPath: '',
				certPath: ''
			},
			publicDirectory: 'public',
			routesDirectory: 'routes',
			logDirectory: 'logs'
		},    
		db: {
			hostname: 'localhost',
	        port: 27017,
	        mainDb: 'ericwadkins_com',
	        useSSL: false,
	        required: true,
	        authenticate: false,
	        authentication: {
	            username: '',
	            password: ''
	        },
	        collections: {
	        }
	    }
}

module.exports = config;