'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../helper.js');

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
                    name: Joi.number().required()
                }).label('alt2')).label('Alt')
            },
            response: {
                schema: Joi.alternatives().try(Joi.object({
                    name: Joi.string().required()
                }).label('alt1'), Joi.object({
                    name: Joi.number().required()
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
                }).label('Model A'), Joi.object({
                    name: Joi.number().required()
                }).label('Model B')).label('Alt')
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

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);

                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/store/'].post.parameters).to.equal([
                    {
                        'in': 'body',
                        'schema': {
                            'type': 'number'
                        },
                        'x-alternatives': [
                            {
                                'type': 'number'
                            },
                            {
                                'type': 'string'
                            }
                        ],
                        'name': 'body'
                    }
                ]);


                expect(response.result.paths['/store2/'].post.parameters).to.equal([
                    {
                        'in': 'body',
                        'name': 'body',
                        'schema': {
                            '$ref': '#/definitions/Alt',
                            'type': 'object'
                        },
                        'x-alternatives': [
                            {
                                '$ref': '#/x-alt-definitions/alt1',
                                'type': 'object'
                            },
                            {
                                '$ref': '#/x-alt-definitions/alt2',
                                'type': 'object'
                            }
                        ]
                    }
                ]);


                expect(response.result.paths['/store2/'].post.responses).to.equal({
                    '200': {
                        'schema': {
                            '$ref': '#/definitions/Alt',
                            'type': 'object',
                            'x-alternatives': [
                                {
                                    '$ref': '#/x-alt-definitions/alt1',
                                    'type': 'object'
                                },
                                {
                                    '$ref': '#/x-alt-definitions/alt2',
                                    'type': 'object'
                                }
                            ]
                        },
                        'description': 'Successful'
                    }
                });


                expect(response.result['x-alt-definitions'].alt1).to.equal({
                    'type': 'object',
                    'properties': {
                        'name': {
                            'type': 'string'
                        }
                    },
                    'required': [
                        'name'
                    ]
                });

                //console.log(JSON.stringify(response.result.definitions['Model 1']));
                expect(response.result.definitions['Model 1']).to.equal({
                    'type': 'object',
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
                            '$ref': '#/definitions/Dimensions',
                            'type': 'object',
                            'x-alternatives': [
                                {
                                    '$ref': '#/x-alt-definitions/Dimensions',
                                    'type': 'object'
                                }
                            ]
                        }
                    }
                });

                // test full swagger document
                Helper.validate(response, done, expect);
            });
        });
    });



    lab.test('no x-alternatives', (done) => {
        Helper.createServer({ xProperties: false }, routes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);

                expect(response.result.paths['/store/'].post.parameters).to.equal([
                    {
                        'name': 'body',
                        'in': 'body',
                        'schema': {
                            'type': 'number'
                        }
                    }
                ]);
                expect(response.result.paths['/store2/'].post.parameters).to.equal([
                    {
                        'name': 'body',
                        'in': 'body',
                        'schema': {
                            '$ref': '#/definitions/Alt',
                            'type': 'object'
                        }
                    }
                ]);

                expect(response.result.paths['/store4/'].post.parameters).to.equal([
                    {
                        'in': 'body',
                        'name': 'body',
                        'schema': {
                            '$ref': '#/definitions/Model 1',
                            'type': 'object'
                        }
                    }
                ]);

                expect(response.result.definitions).to.equal({
                    'Alt': {
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
                    'Dimensions': {
                        'properties': {
                            'width': {
                                'type': 'number'
                            },
                            'height': {
                                'type': 'number'
                            }
                        },
                        'type': 'object'
                    },
                    'Model 1': {
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
                                'type': 'string'
                            },
                            'extra': {
                                '$ref': '#/definitions/Dimensions',
                                'type': 'object'
                            }
                        },
                        'type': 'object'
                    }
                });


                // test full swagger document
                Helper.validate(response, done, expect);
            });
        });

    });
});
