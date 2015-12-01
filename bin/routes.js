'use strict';
var hapi        = require('hapi'),
	Joi 		= require('joi'),
	Boom 		= require('boom'),
	routes,
	resultModel,
	sumModel,
	listModel,
	standardHTTP,
	extendedHTTP,
	fileHTTP;


// mock handler for auth
function defaultAuthHandler(request, reply) {
	if (request.auth && request.auth.credentials && request.auth.credentials.user) {
		reply(request.auth.credentials.user)
	}else{
		reply(Boom.unauthorized(['unauthorized access to admin'], [request.auth.strategy]));
	}
};

// mock handler for all routes
function defaultHandler(request, reply) {
	reply('ok');
};
    
    



resultModel = Joi.object({
	equals: Joi.number(),
}).meta({
  className: 'Result'
});

sumModel = Joi.object({
	id: Joi.string().required().example('x78P9c'),
	a: Joi.number().required().example(5),
	b: Joi.number().required().example(5),
	operator: Joi.string().required().description('either +, -, /, or *').example('+'),
	equals: Joi.number().required().example(10),
	created: Joi.string().required().isoDate().description('ISO date string').example('2015-12-01'),
	modified: Joi.string().isoDate().description('ISO date string').example('2015-12-01'),
}).description('json body for sum').meta({
  className: 'Sum'
});

listModel = Joi.object({
	items: Joi.array().items(sumModel),
	count: Joi.number().required(),
	pageSize: Joi.number().required(),
	page: Joi.number().required(),
	pageCount: Joi.number().required()
}).meta({
  className: 'List'
});

var headers = {
				'X-Rate-Limit-Limit': {
					'description': 'The number of allowed requests in the current period',
					'type': 'integer'
				},
				'X-Rate-Limit-Remaining': {
					'description': 'The number of remaining requests in the current period',
					'type': 'integer'
				},
				'X-Rate-Limit-Reset': {
					'description': 'The number of seconds left in the current period',
					'type': 'integer'
				}
			}
			
var example  = {
  "application/json": {
    "a": 5,
    "b": 5,
    "operator": "+",
    "equals": 10
  }
}


var err400 = Joi.object().description('Bad Request').meta({headers: headers, example: example}),
 	err404 = Joi.object().description('Unsupported Media Type').meta({headers: headers, example: example}),
	err429 = Joi.object().description('Too Many Requests').meta({headers: headers, example: example}),
	err500 = Joi.object().description('Internal Server Error').meta({headers: headers, example: example});

		

standardHTTP = {
		'200': {
			'description': 'Success',
			"schema": sumModel,
			'headers': headers
		},
		'400': {
			'description': 'Bad Request',
			'headers': headers
		},
		'429': {
			'description': 'Too Many Requests',
			'headers': headers
		},
		'500': {
			'description': 'Internal Server Error',
			'headers': headers
		}
	};


extendedHTTP = {
		'400': {
			'description': 'Bad Request'
		},
		'404': {
			'description': 'Sum not found'
		},
		'500': {
			'description': 'Internal Server Error'
		}
	};


fileHTTP = {
		'400': {
			'description': 'Bad Request'
		},
		'404': {
			'description': 'Unsupported Media Type'
		},
		'500': {
			'description': 'Internal Server Error'
		}
	};





// adds the routes and validation for api
module.exports = [{
		method: 'GET',
		path: '/store/',
		config: {
			handler: defaultHandler,
			description: 'List sums',
			notes: ['List the sums in the data store'],
			plugins: {
				'hapi-swagger': {
					responses: standardHTTP
				}
			},
			tags: ['api','reduced','one'],
			validate: { 
				query: {
					page: Joi.number()
						.description('the page number'),

					pagesize: Joi.number()
						.description('the number of items to a page')
				}
			},
			response: {schema : listModel}
		}
	},  {
		method: 'GET',
		path: '/store/{id}',
		config: {
			handler: defaultHandler,
			description: 'Get sum',
			notes: ['Get a sum from the store'],
			plugins: {
				'hapi-swagger': {
					responses: extendedHTTP
				}
			},
			tags: ['api','reduced','two'],
			validate: { 
				params: {
					id: Joi.string()
						.required()
						.description('the id of the sum in the store')
				}
			},
			response: {schema : sumModel}
		}
	},  {
		method: 'POST',
		path: '/store/',
		config: {
			handler: defaultHandler,
			description: 'Add sum',
			notes: ['Adds a sum to the data store'],
			plugins: {
				'hapi-swagger': {
					responses: standardHTTP,
					payloadType: 'form',
					nickname: 'storeit'
				}
			},
			tags: ['api','reduced','three'],
			validate: { 
				payload: {
					a: Joi.number()
						.required()
						.description('the first number'),

					b: Joi.number()
						.required()
						.description('the second number'),

					operator: Joi.string()
						.required()
						.default('+')
						.description('the opertator i.e. + - / or *'),

					equals: Joi.number()
						.required()
						.description('the result of the sum')
				}
			},
			response: {schema : sumModel}
		}
	},  {
		method: 'PUT',
		path: '/store/{id}',
		config: {
			handler: defaultHandler,
			description: 'Update sum',
			notes: ['Update a sum in our data store'],
			plugins: {
				'hapi-swagger': {
					responses: extendedHTTP,
					payloadType: 'form'
				}
			},
			tags: ['api'],
			validate: {
				params: {
					id: Joi.string()
						.required()
						.description('the id of the sum in the store')
				}, 
				payload: {
					a: Joi.number()
						.required()
						.description('the first number')
						.example(5),

					b: Joi.number()
						.required()
						.description('the second number')
						.example(5),

					operator: Joi.string()
						.required()
						.default('+')
						.description('the opertator i.e. + - / or *')
						.example('+'),

					equals: Joi.number()
						.required()
						.description('the result of the sum')
						.example(10)
				}
			},
			response: {schema : sumModel}
		}
	}, {
		method: 'DELETE',
		path: '/store/{id}',
		config: {
			handler: defaultHandler,
			description: 'Delete sums',
			notes: ['Delete a sums from the data store'],
			plugins: {
				'hapi-swagger': {
					responses: extendedHTTP
				}
			},
			tags: ['api'],
			validate: { 
				params: {
					id: Joi.string()
						.required()
						.description('the id of the sum in the store')
				}
			}
		}
	}, {
		method: 'POST',
		path: '/store/payload/',
		config: {
			handler: defaultHandler,
			description: 'Add sum, with JSON object',
			notes: ['Adds a sum to the data store, using JSON object in payload'],
			plugins: {
				'hapi-swagger': {
					responses: standardHTTP
				}
			},
			tags: ['api','reduced','three'],
			validate: { 
				payload: sumModel
			},
			response: {
				status: {
					200: sumModel,
					400: err400,
					404: err404,
					429: err429,
					500: err500
				}
			}
		}
	}, {
	    method: 'POST',
	    path: '/store/file/',
	    config: {
	        handler: defaultHandler,
			description: 'Add sum, with JSON file',
			notes: ['Adds a sum to the data store, using JSON object in a uploaded file'],
			plugins: {
				'hapi-swagger': {
					responses: fileHTTP,
					payloadType: 'form'
				}
			},
			tags: ['api','reduced','three'],
	        validate: {
	            payload: { 
	            	file: Joi.any()
	            		.meta({ swaggerType: 'file' })
	            		.required()
	            		.description('json file with object containing: a, b, operator and equals')
	            }
	        },
	        payload: {
	            maxBytes: 1048576,
	            parse: true,
	            output: 'stream'
	        },
	    	response: {schema : sumModel}
	    }
	},];





	
	
