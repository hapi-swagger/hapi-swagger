const Joi = require('joi');
const Js2xmlparser = require('js2xmlparser');

const sumModel = Joi.object({
  id: Joi.string().required().example('x78P9c'),
  a: Joi.number().required().example(5),
  b: Joi.number().required().example(5),
  operator: Joi.string().required().description('either +, -, /, or *').example('+'),
  equals: Joi.number().required().example(10),
  created: Joi.string().required().isoDate().description('ISO date string').example('2015-12-01'),
  modified: Joi.string().isoDate().description('ISO date string').example('2015-12-01')
})
  .label('Sum')
  .description('json body for sum');

const listModel = Joi.object({
  items: Joi.array().items(sumModel),
  count: Joi.number().required().example('1'),
  pageSize: Joi.number().required().example('10'),
  page: Joi.number().required().example('1'),
  pageCount: Joi.number().required().example('1')
}).label('List');

const resultModel = Joi.object({
  equals: Joi.number()
}).label('Result');

const errorModel = Joi.object({
  code: Joi.number(),
  msg: Joi.string()
}).label('Error');

const sumHTTPStatus = {
  200: {
    description: 'Success',
    schema: sumModel
  },
  400: {
    description: 'Bad request (Reason #1)  \nBad request (Reason #2)',
    schema: errorModel
  },
  500: {
    description: 'Internal Server Error',
    schema: errorModel
  }
};

const listHTTPStatus = {
  200: {
    description: 'Success',
    schema: listModel
  },
  400: {
    description: 'Bad Request'
  },
  404: {
    description: 'Sum not found'
  },
  500: {
    description: 'Internal Server Error'
  }
};

const fileHTTPStatus = {
  200: {
    description: 'Success',
    schema: sumModel
  },
  400: {
    description: 'Bad Request'
  },
  404: {
    description: 'Unsupported Media Type'
  },
  500: {
    description: 'Internal Server Error'
  }
};

const resultHTTPStatus = {
  200: {
    description: 'Success',
    schema: resultModel
  },
  400: {
    description: 'Bad Request'
  },
  404: {
    description: 'Sum not found'
  },
  500: {
    description: 'Internal Server Error'
  }
};

/**
 * allows a reply to have either a json or xml response
 *
 * @param  {string} name
 * @param  {Object} json
 * @param  {Object} request
 * @param  {Object} reply
 */
const replyByType = function (name, json, request, h) {
  if (request.headers.accept === 'application/xml') {
    return h.response(Js2xmlparser(name, json)).type('application/xml');
  }

  return h.response(json).type('application/json');
};

/**
 * mock handler for routes
 *
 * @param  {Object} request
 * @param  {Object} reply
 */
const defaultHandler = function (request, h) {
  const sum = {
    id: 'x78P9c',
    a: 5,
    b: 5,
    operator: '+',
    equals: 10,
    created: '2015-12-01',
    modified: '2015-12-01'
  };
  const list = {
    items: [sum],
    count: 1,
    pageSize: 10,
    page: 1,
    pageCount: 1
  };

  if (request.path.indexOf('/v1/sum/') > -1) {
    return replyByType('result', { equals: 43 }, request, h);
  }

  if (request.path === '/v1/store/' && request.method === 'get') {
    return replyByType('list', list, request, h);
  }

  return replyByType('sum', sum, request, h);
};

module.exports = [
  {
    method: 'PUT',
    path: '/v1/sum/add/{a}/{b}',
    options: {
      handler: defaultHandler,
      description: 'Add',
      tags: ['api', 'reduced'],
      notes: [
        'Adds together two numbers and return the result. As an option you can have the result return as a binary number.'
      ],
      plugins: {
        '@timondev/hapi-swagger': {
          consumes: ['application/json', 'application/xml']
        }
      },
      validate: {
        params: Joi.object({
          a: Joi.number().required().description('the first number'),

          b: Joi.number().required().description('the second number')
        })
      }
    }
  },
  {
    method: 'PUT',
    path: '/v1/sum/subtract/{a}/{b}',
    options: {
      handler: defaultHandler,
      description: 'Subtract',
      notes: ['Subtracts the second number from the first and return the result'],
      tags: ['api'],
      plugins: {
        '@timondev/hapi-swagger': {
          responses: resultHTTPStatus
        }
      },
      validate: {
        params: Joi.object({
          a: Joi.number().required().description('the first number'),

          b: Joi.number().required().description('the second number')
        })
      }
    }
  },
  {
    method: 'PUT',
    path: '/v1/sum/divide/{a}/{b}',
    options: {
      handler: defaultHandler,
      description: 'Divide',
      notes: ['Divides the first number by the second and return the result'],
      tags: ['api'],
      plugins: {
        '@timondev/hapi-swagger': {
          responses: resultHTTPStatus,
          order: 3
        }
      },
      validate: {
        params: Joi.object({
          a: Joi.number().required().description('the first number - can NOT be 0'),

          b: Joi.number().required().description('the second number - can NOT be 0')
        })
      }
    }
  },
  {
    method: 'PUT',
    path: '/v1/sum/multiple/{a}/{b}',
    options: {
      handler: defaultHandler,
      description: 'Multiple',
      notes: ['Multiples the two numbers together and return the result'],
      plugins: {
        '@timondev/hapi-swagger': {
          responses: resultHTTPStatus,
          order: 2
        }
      },
      tags: ['api'],
      validate: {
        params: Joi.object({
          a: Joi.number().required().description('the first number'),

          b: Joi.number().required().description('the second number')
        })
      }
    }
  },
  {
    method: 'GET',
    path: '/v1/store/',
    options: {
      handler: defaultHandler,
      description: 'List sums',
      notes: ['List the sums in the data store'],
      plugins: {
        '@timondev/hapi-swagger': {
          responses: listHTTPStatus
        }
      },
      tags: ['api', 'reduced', 'one'],
      validate: {
        query: Joi.object({
          page: Joi.number().description('the page number'),

          pagesize: Joi.number().description('the number of items to a page')
        })
      }
    }
  },
  {
    method: 'GET',
    path: '/v1/store/{id}',
    options: {
      handler: defaultHandler,
      description: 'Get sum',
      notes: ['Get a sum from the store'],
      plugins: {
        '@timondev/hapi-swagger': {
          responses: sumHTTPStatus
        }
      },
      tags: ['api', 'reduced', 'two'],
      validate: {
        params: Joi.object({
          id: Joi.string().required().description('the id of the sum in the store')
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/v1/store/',
    options: {
      handler: defaultHandler,
      description: 'Add sum',
      notes: ['Adds a sum to the data store'],
      plugins: {
        '@timondev/hapi-swagger': {
          responses: sumHTTPStatus,
          payloadType: 'form',
          produces: ['application/json', 'application/xml'],
          consumes: ['application/json', 'application/xml']
        }
      },
      tags: ['api', 'reduced', 'three'],
      validate: {
        payload: Joi.object({
          a: Joi.number().required().description('the first number').default(10),

          b: Joi.number().required().description('the second number'),

          operator: Joi.string()
            .required()
            .default('+')
            .valid('+', '-', '/', '*')
            .description('the operator i.e. + - / or *'),

          equals: Joi.number().required().description('the result of the sum')
        })
      }
    }
  },
  {
    method: 'PUT',
    path: '/v1/store/{id?}',
    options: {
      handler: defaultHandler,
      description: 'Update sum',
      notes: ['Update a sum in our data store'],
      plugins: {
        '@timondev/hapi-swagger': {
          responses: sumHTTPStatus,
          payloadType: 'form'
        }
      },
      tags: ['api'],
      validate: {
        params: Joi.object({
          id: Joi.string().required().description('the id of the sum in the store')
        }),
        payload: Joi.object({
          a: Joi.number().required().description('the first number'),

          b: Joi.number().required().description('the second number'),

          operator: Joi.string()
            .required()
            .default('+')
            .valid('+', '-', '/', '*')
            .description('the operator i.e. + - / or *'),

          equals: Joi.number().required().description('the result of the sum')
        })
      }
    }
  },
  {
    method: 'DELETE',
    path: '/v1/store/{id}',
    options: {
      handler: defaultHandler,
      description: 'Delete sums',
      notes: ['Delete a sums from the data store'],
      plugins: {
        '@timondev/hapi-swagger': {
          responses: sumHTTPStatus
        }
      },
      tags: ['api'],
      validate: {
        params: Joi.object({
          id: Joi.string().required().description('the id of the sum in the store')
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/v1/store/payload/',
    options: {
      handler: defaultHandler,
      description: 'Add sum, with JSON object',
      notes: ['Adds a sum to the data store, using JSON object in payload'],
      plugins: {
        '@timondev/hapi-swagger': {
          responses: sumHTTPStatus
        }
      },
      tags: ['api', 'reduced', 'three'],
      validate: {
        payload: Joi.object({
          a: Joi.number().required().description('the first number'),

          b: Joi.number().required().description('the second number'),

          operator: Joi.string()
            .required()
            .default('+')
            .valid('+', '-', '/', '*')
            .description('the operator i.e. + - / or *'),

          equals: Joi.number().required().description('the result of the sum')
        }).label('Compact Sum'),
        headers: Joi.object({
          accept: Joi.string()
            .required()
            .valid('application/json', 'application/vnd.api+json')
            .default('application/vnd.api+json')
        }).unknown()
      }
    }
  },
  {
    method: 'POST',
    path: '/v1/store/file/',
    options: {
      handler: defaultHandler,
      description: 'Add sum, with JSON file',
      notes: ['Adds a sum to the data store, using JSON object in a uploaded file'],
      plugins: {
        '@timondev/hapi-swagger': {
          responses: fileHTTPStatus,
          payloadType: 'form',
          consumes: ['multipart/form-data'],
          deprecated: true
        }
      },
      tags: ['api', 'reduced', 'three'],
      validate: {
        payload: Joi.object({
          file: Joi.any()
            .meta({ swaggerType: 'file' })
            .required()
            .description('json file with object containing: a, b, operator and equals')
        })
      },
      payload: {
        maxBytes: 1048576,
        parse: true,
        output: 'stream'
      }
    }
  },
  {
    method: 'GET',
    path: '/',
    options: {
      handler: function (request, h) {
        return h.view('custom.html', {});
      }
    }
  }
];
