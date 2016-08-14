'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('alternatives', () => {

    const routes = [{
        method: 'POST',
        path: '/store/',
        config: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.alternatives().try(Joi.number(), Joi.string()).label('Alt')
            }
        }
    },{
        method: 'POST',
        path: '/store2/',
        config: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.alternatives().try(Joi.object({
                    name: Joi.string().required()
                }).label('alt1'), Joi.object({
                    name: Joi.string().required()
                }).label('alt2')).label('Alt')
            }
        }
    },{
        method: 'POST',
        path: '/store3/',
        config: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.alternatives().try(Joi.object({
                    name: Joi.string().required()
                }).label('Model'), Joi.object({
                    name: Joi.string().required()
                }).label('Model 1')).label('Alt')
            }
        }
    },{
        method: 'POST',
        path: '/store4/',
        config: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    type: Joi.string().valid('string', 'number', 'image').label('Type'),
                    data: Joi.alternatives()
                        .when('type', { is: 'string', then: Joi.string() })
                        .when('type', { is: 'number', then: Joi.number() })
                        .when('type', { is: 'image', then: Joi.string().uri() })
                        .label('Typed Data'),
                    extra: Joi.alternatives()
                        .when('type', {
                            is: 'image',
                            then: Joi.object({
                                width: Joi.number(),
                                height: Joi.number()
                            }).label('Dimensions'),
                            otherwise: Joi.forbidden()
                        }).label('Extra')
                })
            }
        }
    },{
        method: 'POST',
        path: '/store5/',
        config: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    type: Joi.string().valid('string', 'number', 'image').label('Type'),
                    data: Joi.alternatives()
                        .when('type', { is: 'string', then: Joi.string() })
                        .when('type', { is: 'number', then: Joi.number() })
                        .when('type', { is: 'image', then: Joi.string().uri() })
                        .label('Typed Data'),
                    extra: Joi.alternatives()
                        .when('type', {
                            is: 'image',
                            then: Joi.object({
                                width: Joi.number(),
                                height: Joi.number()
                            }).label('Dimensions'),
                            otherwise: Joi.forbidden()
                        }).label('Extra')
                })
            }
        }
    }];


    lab.test('x-alternatives', (done) => {

        Helper.createServer({ derefJSONSchema: true }, routes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/store/'].post.parameters).to.equal([
                    {
                        'in': 'body',
                        'x-alternatives': [
                            {
                                'type': 'number'
                            },
                            {
                                'type': 'string'
                            }
                        ],
                        'schema': {
                            'x-alternatives': [
                                {
                                    'type': 'number'
                                },
                                {
                                    'type': 'string'
                                }
                            ],
                            'type': 'number'
                        },
                        'name': 'body'
                    }
                ]);


                expect(response.result.paths['/store2/'].post.parameters).to.equal([
                    {
                        'name': 'body',
                        'schema': {
                            'properties': {
                                'name': {
                                    'type': 'string'
                                }
                            },
                            'required': [
                                'name'
                            ],
                            'type': 'object'
                        },
                        'x-alternatives': [
                            {
                                'type': 'object',
                                'name': 'alt1',
                                'schema': {
                                    'properties': {
                                        'name': {
                                            'type': 'string'
                                        }
                                    },
                                    'required': [
                                        'name'
                                    ],
                                    'type': 'object'
                                }
                            },
                            {
                                'type': 'object',
                                'name': 'alt2',
                                'schema': {
                                    'properties': {
                                        'name': {
                                            'type': 'string'
                                        }
                                    },
                                    'required': [
                                        'name'
                                    ],
                                    'type': 'object'
                                }
                            }
                        ],
                        'in': 'body'
                    }
                ]);

                expect(response.result.paths['/store4/'].post.parameters).to.equal([
                    {
                        'in': 'body',
                        'name': 'body',
                        'schema': {
                            'properties': {
                                'type': {
                                    'type': 'string',
                                    'enum': [
                                        'string',
                                        'number',
                                        'image'
                                    ]
                                },
                                'data': {
                                    'type': 'string',
                                    'x-alternatives': [
                                        {
                                            'type': 'string'
                                        },
                                        {
                                            'type': 'number'
                                        },
                                        {
                                            'type': 'string',
                                            'x-format': {
                                                'uri': true
                                            }
                                        }
                                    ]
                                },
                                'extra': {
                                    'type': 'object',
                                    'x-alternatives': [
                                        {
                                            'type': 'object',
                                            'name': 'Dimensions',
                                            'schema': {
                                                'properties': {
                                                    'width': {
                                                        'type': 'number'
                                                    },
                                                    'height': {
                                                        'type': 'number'
                                                    }
                                                },
                                                'type': 'object'
                                            }
                                        }
                                    ],
                                    'properties': {
                                        'width': {
                                            'type': 'number'
                                        },
                                        'height': {
                                            'type': 'number'
                                        }
                                    }
                                }
                            }, 'type': 'object'
                        }
                    }
                ]);


                done();
            });
        });
    });


});
