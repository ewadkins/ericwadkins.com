module.exports = buildDocument;

function buildDocument(body, fields) {
		var document = {};
		for (var field in fields) {
			if (fields.hasOwnProperty(field)) {
				var value = extract(field);
				if (value !== undefined) {
					var parsed = parse(value, field, fields);
					if (parsed) {
						document[field] = parsed;
					}
				}
			}
		}
		function parse(value, field, fields) {
			if (typeof fields[field] === 'string') {
				return convert(fields[field], value)
			}
			else {
				if (fields[field].type === 'array' && value) {
					var result = [];
					if (typeof fields[field].contents === 'string') {
						for (var i = 0; i < value.length; i++) {
							var element = convert(fields[field].contents, value[i]);
							if (element) {
								result.push(element);
							}
						}
					}
					else {
						if (fields[field].contents.type === 'array') {
							for (var i = 0; i < value.length; i++) {
								var element = db.buildDocument({ $result: value[i] }, { $result: fields[field].contents }).$result;
								if (element) {
									result.push(element);
								}
							}
						}
						else if (fields[field].contents.type === 'object') {
							for (var i = 0; i < value.length; i++) {
								var element = db.buildDocument(value[i], fields[field].contents.contents);
								if (element) {
									result.push(element);	
								}
							}
						}	
					}
					return result;
				}
				else if (fields[field].type === 'object' && value) {
					return db.buildDocument(value, fields[field].contents);
				}
			}
		}
		
		function convert(type, value) {
			if (type === 'string' && (value || value === '')) {
				return value;
			}
			else if (type === 'integer' && value) {
				return parseInt(value);
			}
			else if (type === 'float' && value) {
				return parseFloat(value);
			}
			else if (type === 'date' && value) {
				return new Date(value);
			}
			else if (type === 'ObjectID' && value && value.length === 24) {
				return ObjectID.createFromHexString(value);
			}
			else if (type === 'password' && value) {
				var salt = bcrypt.genSaltSync(10);
			    return bcrypt.hashSync(value, salt);
			}
		}
		
		function extract(field) {
			var value = body[field] || body[underscore(field)] || body[camelcase(field)] || body[field.toLowerCase()] || body[underscore(field).toLowerCase()] || body[camelcase(field).toLowerCase()];
			if (value) {
				return value;
			}
			for (var f in body) {
				if (body.hasOwnProperty(f)) {
					if (f.toLowerCase() === field.toLowerCase() || underscore(f).toLowerCase() === underscore(field).toLowerCase() || camelcase(f).toLowerCase() === camelcase(field).toLowerCase()) {
						return body[f];
					}
				}
			}
			return body[field];
		}
		function camelcase(string) {
			return string.replace(/([-_][a-z])/g, function($1){return $1.toUpperCase().replace(/[-_]/,'');});
		};
		function underscore(string) {
			return string.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});
		}
		return document;
	}