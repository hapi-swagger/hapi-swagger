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
                            'x-alternatives': [
                                {
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
                                    },
                                    'type': 'object'
                                },
                                {
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
                                    },
                                    'type': 'object'
                                }
                            ],
                            'type': 'object',
                            'properties': {
                                'name': {
                                    'type': 'string'
                                }
                            },
                            'required': [
                                'name'
                            ]
                        },
                        'x-alternatives': [
                            {
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
                                },
                                'type': 'object'
                            },
                            {
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
                                },
                                'type': 'object'
                            }
                        ],
                        'in': 'body'
                    }
                ]);

                done();
            });
        });
    });


});
