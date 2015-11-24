'use strict';
var hapi        = require('hapi'),
	Joi 		= require('joi'),
	routes,
	resultModel,
	sumModel,
	listModel,
	standardHTTP,
	extendedHTTP,
	fileHTTP;


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


standardHTTP = {
		'200': {
			'description': 'Success',
			"schema": sumModel
		},
		'400': {
			'description': 'Bad Request'
		},
		'500': {
			'description': 'Internal Server Error'
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
          method: 'POST',
          path: '/tools/microformats/1',
          config: {
              tags: ['api'],
              plugins: {
                  'hapi-swagger': {
                      nickname: 'microformatsapi1',
                      validate: {
                          payload: {
                               a: Joi.number()
                                    .required()
                                    .description('the first number'),
                               b: Joi.number()
                                    .required()
                                    .description('the first number')
                          },
                          query: {
                            testquery: Joi.string()
                          },
                          params: {
                            testparam: Joi.string()
                          },
                          headers: {
                            testheaders: Joi.string()
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
      },{
          method: 'POST',
          path: '/tools/microformats/2',
          config: {
              tags: ['api'],
              plugins: {
                  'hapi-swagger': {
                      nickname: 'microformatsapi2',
                      validate: {
                          payload: Joi.object({
                              a: Joi.number()
                                   .required()
                                   .description('the first number'),
							  b: Joi.number()
                                    .required()
                                    .description('the first number')
                              }).meta({className: 'SumX'}),
                          query: {
                            testquery: Joi.string()
                          },
                          params: {
                            testparam: Joi.string()
                          },
                          headers: {
                            testheaders: Joi.string()
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
      },{
		method: 'POST',
		path: '/store/payload/1',
		config: {
			handler:  defaultHandler,
			description: 'Add sum, with JSON object',
			notes: ['Adds a sum to the data store, using JSON object in payload'],
			tags: ['api','reduced','three'],
			validate: { 
				payload: Joi.object({
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
				}).meta({className: 'Sum'})
			},

		}
	},{
		method: 'POST',
		path: '/store/payload/2',
		config: {
			handler:  defaultHandler,
			description: 'Add sum, with JSON object',
			notes: ['Adds a sum to the data store, using JSON object in payload'],
			tags: ['api','reduced','three'],
			validate: { 
				payload: Joi.object({
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
				}).meta({className: 'Sum'})
			},

		}
	},{
		method: 'POST',
		path: '/store/payload/3',
		config: {
			handler:  defaultHandler,
			description: 'Add sum, with JSON object',
			notes: ['Adds a sum to the data store, using JSON object in payload'],
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

		}
	},{
		method: 'POST',
		path: '/store/',
		config: {
			handler: defaultHandler,
			description: 'Add sum',
			notes: ['Adds a sum to the data store'],
			plugins: {
				'hapi-swagger': {
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
			}
		}
	}, ];



