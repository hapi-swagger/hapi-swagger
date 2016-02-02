'use strict';
const Joi = require('joi');

module.exports = [{
    method: 'GET',
    path: '/ratings1/{image}',
    config: {
        handler: function (request, reply) {

            reply('hello');
        },
        tags: ['api'],
        validate: {
            params: {
                image: Joi.string().required()
            }
        }
    }
},{
    method: 'GET',
    path: '/ratings2/{image}',
    config: {
        handler: function (request, reply) {

            reply('hello');
        },
        tags: ['api'],
        validate: {
            params: {
                image: Joi.string().optional()
            }
        }
    }
},{
    method: 'GET',
    path: '/ratings3/{image}',
    config: {
        handler: function (request, reply) {

            reply('hello');
        },
        tags: ['api'],
        validate: {
            params: {
                image: Joi.string()
            }
        }
    }
},{
    method: 'GET',
    path: '/ratings4/{image?}',
    config: {
        handler: function (request, reply) {

            reply('hello');
        },
        tags: ['api'],
        validate: {
            params: {
                image: Joi.string()
            }
        }
    }
},{
    method: 'GET',
    path: '/{path*}',
    handler: {
        directory: {
            path: './public',
            listing: false,
            index: true
        }
    }
}];
