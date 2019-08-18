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
			miscDirectory: 'misc',
			logDirectory: 'logs',
			index: 'index.html',
			schedule: 'schedule.html',
			resume: 'doc/Resume - Eric Wadkins - Fall 2019.pdf',
            thesis: 'doc/MEng_Thesis_FINAL.pdf',
			p1: 'doc/Computer_Vision_Tools_NV_Centers.pdf',
			p2: 'doc/Utility_Programs_NV_Centers.pdf',
			p3: 'doc/Smart_Microscopy.pdf',
            signature: 'img/signature_transparent.png',
			dashboard: 'dashboard/index.html',
			collage: 'dashboard/collage/index.html',
			gas: 'dashboard/gas/index.html',
            map: 'map.html',
            analytics: 'analytics.html',
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
	            password: 'd0gd4ys'
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