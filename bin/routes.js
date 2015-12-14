'use strict';
var Joi = require('joi');


var sumModel = Joi.object({
    id: Joi.string().required().example('x78P9c'),
    a: Joi.number().required().example(5),
    b: Joi.number().required().example(5),
    operator: Joi.string().required().description('either +, -, /, or *').example('+'),
    equals: Joi.number().required().example(10),
    created: Joi.string().required().isoDate().description('ISO date string').example('2015-12-01'),
    modified: Joi.string().isoDate().description('ISO date string').example('2015-12-01')
}).label('Sum').description('json body for sum');

var listModel = Joi.object({
    items: Joi.array().items(sumModel),
    count: Joi.number().required(),
    pageSize: Joi.number().required(),
    page: Joi.number().required(),
    pageCount: Joi.number().required()
}).label('List');

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
};

var example = {
    'application/json': {
        'a': 5,
        'b': 5,
        'operator': '+',
        'equals': 10
    }
};

var err400 = Joi.object().description('Bad Request').meta({ headers: headers, example: example }),
    err404 = Joi.object().description('Unsupported Media Type').meta({ headers: headers, example: example }),
    err429 = Joi.object().description('Too Many Requests').meta({ headers: headers, example: example }),
    err500 = Joi.object().description('Internal Server Error').meta({ headers: headers, example: example });

var standardHTTP = {
    '200': {
        'description': 'Success',
        'schema': sumModel,
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

var extendedHTTP = {
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

var fileHTTP = {
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


/**
 * mock handler for routes
 *
 * @param  {Object} request
 * @param  {Object} reply
 */
var defaultHandler = function (request, reply) {

    reply('ok');
};


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
        tags: ['api', 'reduced', 'one'],
        validate: {
            query: {
                page: Joi.number()
                    .description('the page number'),

                pagesize: Joi.number()
                    .description('the number of items to a page')
            }
        },
        response: { schema: listModel }
    }
},{
        method: 'POST',
        path: '/foo/v1/bar',
        config: {
            description: '...',
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    outer1: Joi.object({
                        inner1: Joi.string()
                    }),
                    outer2: Joi.object({
                        inner2: Joi.string()
                    })
                }).label('foo-label')
            },
            handler: defaultHandler
        }
    }];
