'use strict';
const Joi = require('joi');


const personModel = Joi.object({
    name: Joi.string().required(),
    age: Joi.number().min(1).max(130),
    secret: Joi.string()
}).label('Person').meta({ 'x': 'y' });


const listPersonModel = Joi.object({
    items: Joi.array().items(personModel),
    count: Joi.number().required().example('1'),
    pageSize: Joi.number().required().example('10'),
    page: Joi.number().required().example('1'),
    pageCount: Joi.number().required().example('1')
}).label('People').meta({ 'a': 'b' });


const gadetModel = Joi.object({
    type: Joi.string().required().valid('mobile phone', 'tablet', 'laptop', 'tower'),
    cost: Joi.number().required().min(0).max(3000),
    brand: Joi.string(),
    person: personModel
}).label('Gadget');


const personAltModels = Joi.alternatives().try(personModel, listPersonModel).label('Person');


const resultHTTPStatus = {
    '200': {
        'description': 'Success',
        'schema': personAltModels
    }
};


module.exports = [{
    method: 'POST',
    path: '/alt/simple',
    config: {
        plugins: {
            'hapi-swagger': {
                'produces': ['application/json'],
                'consumes': ['text/plain', 'application/json']
            }
        },
        handler: (request, reply) => {

            reply({ 'msg': 'x' }).type('application/json');
        },
        tags: ['api'],
        validate: {
            payload: Joi.alternatives().try(Joi.number(), Joi.string()).label('Alt')
        }
    }
}, {
    method: 'POST',
    path: '/alt/person',
    config: {
        plugins: {
            'hapi-swagger': {
                'responses': resultHTTPStatus,
                'produces': ['application/json', 'application/vnd.api+json']
            }
        },
        handler: (request, reply) => {

            reply({ 'msg': 'x' }).type('application/json');
        },
        tags: ['api'],
        validate: {
            payload: personAltModels,
            query: {
                a: Joi.string()
            }
        }
    }
}, {
    method: 'GET',
    path: '/alt/person',
    config: {
        plugins: {
            'hapi-swagger': {
                'responses': resultHTTPStatus,
                'produces': ['application/json', 'application/vnd.api+json']
            }
        },
        handler: (request, reply) => {

            reply({ 'name': 'glenn', 'age': 21, 'secret': 'brighton' }).type('application/json');
        },
        tags: ['api']
    }
}, {
    method: 'POST',
    path: '/alt/gadet',
    config: {
        handler: (request, reply) => {

            reply({ 'msg': 'x' }).type('application/json');
        },
        tags: ['api'],
        validate: {
            payload: gadetModel,
            headers: Joi.object({
                accept: Joi.string().required().valid(['application/json', 'application/vnd.api+json']).default('application/vnd.api+json')
            }).unknown()
        }
    }
}, {
    method: 'GET',
    path: '/withconditionalalternatives',
    config: {
        tags: ['api'],
        handler: (request, reply) => {

            reply({ 'msg': 'x' }).type('application/json');
        },
        validate: {
            query: {
                param1: Joi.alternatives()
                    .when('b', {
                        is: 5,
                        then: Joi.string(),
                        otherwise: Joi.number().required().description('Things and stuff')
                    })
                    .when('a', {
                        is: true,
                        then: Joi.date(),
                        otherwise: Joi.any()
                    }),
                param2: Joi.alternatives()
                    .when('b', {
                        is: 5,
                        then: Joi.string()
                    })
                    .when('a', {
                        is: true,
                        otherwise: Joi.any()
                    })
            }
        }
    }
}, {
    method: 'GET',
    path: '/formdata',
    config: {
        tags: ['api'],
        handler: (request, reply) => {

            reply({ 'msg': 'x' }).type('application/json');
        },
        validate: {
            query: {
                param1: Joi.array().items({ 'text': Joi.string() })
            }
        }
    }
}];


