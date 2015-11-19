'use strict';
var hapi        = require('hapi'),
	Joi 		= require('joi'),
	routes,
	resultModel,
	sumModel,
	listModel,
	standardHTTPErrors,
	extendedHTTPErrors,
	fileHTTPErrors;


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
	id: Joi.string().required(),
	a: Joi.number().required(),
	b: Joi.number().required(),
	operator: Joi.string().required().description('either +, -, /, or *'),
	equals: Joi.number().required(),
	created: Joi.string().required().isoDate().description('ISO date string'),
	modified: Joi.string().isoDate().description('ISO date string'),
}).meta({
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


standardHTTPErrors = {
		'200': {
			'description': 'Success',
			"schema": {
				"type": "array",
				"items": {
					"$ref": "#/definitions/Sum"
				}
			}
		},
		'400': {
			'description': 'Bad Request'
		},
		'500': {
			'description': 'Internal Server Error'
		}
	};


extendedHTTPErrors = {
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


fileHTTPErrors = {
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
		method: 'PUT',
		path: '/sum/add/{a}/{b}',
		config: {
			handler: defaultHandler,
			description: 'Add',
			tags: ['api','reduced'],
			notes: ['Adds together two numbers and return the result. As an option you can have the result return as a binary number.'],
			plugins: {
				'hapi-swagger': {
					responses: standardHTTPErrors
				}
			},
			validate: { 
				params: {
					a: Joi.number()
						.required()
						.description('the first number')
						.example(8),

					b: Joi.number()
						.required()
						.description('the second number')
						.example(4)
				},
				headers: Joi.object({
							'x-format': Joi.string()
								.valid('decimal', 'binary')
								.default('decimal')
								.description('return result as decimal or binary')
						}).unknown()
			},
			response: {schema : resultModel}
		}
	},{
		method: 'PUT',
		path: '/sum/subtract/{a}/{b}',
		config: {
			handler: defaultHandler,
			description: 'Subtract',
			notes: ['Subtracts the second number from the first and return the result'],
			tags: ['api'],
			plugins: {
				'hapi-swagger': {
					responses: standardHTTPErrors
				}
			},
			validate: { 
				params: {
					a: Joi.number()
						.required()
						.description('the first number'),

					b: Joi.number()
						.required()
						.description('the second number')
				}
			},
			response: {schema : resultModel}
		}
	},{
		method: 'PUT',
		path: '/sum/divide/{a}/{b}',
		config: {
			handler: defaultHandler,
			description: 'Divide',
			notes: ['Divides the first number by the second and return the result'],
			tags: ['api'],
			plugins: {
				'hapi-swagger': {
					responses: standardHTTPErrors
				}
			},
			validate: { 
				params: {
					a: Joi.number()
						.required()
						.description('the first number - can NOT be 0'),

					b: Joi.number()
						.required()
						.description('the second number - can NOT be 0')
				}
			},
			response: {schema : resultModel}
		}
	},{
		method: 'PUT',
		path: '/sum/multiple/{a}/{b}',
		config: {
			handler: defaultHandler,
			description: 'Multiple',
			notes: ['Multiples the two numbers together and return the result'],
			plugins: {
				'hapi-swagger': {
					responses: standardHTTPErrors
				}
			},
			tags: ['api','reduced'],
			validate: { 
				params: {
					a: Joi.number()
						.required()
						.description('the first number'),

					b: Joi.number()
						.required()
						.description('the second number')
				}
			},
			response: {schema : resultModel}
		}
	},{
		method: 'GET',
		path: '/store/',
		config: {
			handler: defaultHandler,
			description: 'List sums',
			notes: ['List the sums in the data store'],
			plugins: {
				'hapi-swagger': {
					responses: standardHTTPErrors
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
					responses: extendedHTTPErrors
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
					responses: standardHTTPErrors,
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
					responses: extendedHTTPErrors,
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
	}, {
          method: 'POST',
          path: '/tools/microformats/',
          config: {
              description:'parse microformats',
			  notes: ['Uses H2o2 to proxy an API'],
              tags: ['api'],
              plugins: {
                  'hapi-swagger': {
                      nickname: 'microformatsapi',
                      validate: {
                          params: {
                            url: Joi.string().uri().required(),
                            callback: Joi.string(),
                            collapsewhitespace: Joi.boolean(),
                            dateformat: Joi.any().allow(['auto', 'w3c', 'rfc3339', 'html5'])
                          }
                      }
                  },
              },
              handler: {
                  proxy: {
                      host: 'glennjones.net',
                      protocol: 'http',
                      onResponse: defaultHandler
                  }
              }
          }
      }];



