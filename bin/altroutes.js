'use strict';
const Joi = require('joi');


const personModel = Joi.object({
    name: Joi.string().required(),
    age: Joi.number().min(1).max(130),
    secret: Joi.string()
}).label('Person');


const gadetModel = Joi.object({
    type: Joi.string().required().valid('mobile phone', 'tablet', 'laptop', 'tower'),
    cost: Joi.number().required().min(0).max(3000),
    brand: Joi.string(),
    person: personModel
}).label('Gadget');



module.exports = [{
    method: 'POST',
    path: '/alt/simple',
    config: {
        handler: (request, reply) => {

            reply({ 'msg': 'x' }).type('application/json');
        },
        tags: ['api'],
        validate: {
            payload: Joi.alternatives().try(Joi.number(), Joi.string()).label('Alt'),
            headers: Joi.object({
                accept: Joi.string().required().valid(['application/json', 'application/vnd.api+json']).default('application/vnd.api+json')
            }).unknown()
        }
    }
}, {
    method: 'POST',
    path: '/alt/person',
    config: {
        handler: (request, reply) => {

            reply({ 'msg': 'x' }).type('application/json');
        },
        tags: ['api'],
        validate: {
            payload: personModel,
            headers: Joi.object({
                accept: Joi.string().required().valid(['application/json', 'application/vnd.api+json']).default('application/vnd.api+json')
            }).unknown()
        }
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
}];


