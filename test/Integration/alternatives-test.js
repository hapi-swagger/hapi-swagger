const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('alternatives', () => {

    const routes = [{
        method: 'POST',
        path: '/store/',
        options: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.alternatives().try(Joi.number(), Joi.string()).label('Alt')
            }
        }
    },{
        method: 'POST',
        path: '/store2/',
        options: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.alternatives().try(
                    Joi.object({
                        name: Joi.string().required()
                    }).label('alt1'),
                    Joi.object({
                        name: Joi.number().required()
                    }).label('alt2'))
                    .label('Alt')
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
        options: {
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
        options: {
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
        options: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    type: Joi.string().valid('string', 'number', 'image').label('Type'),
                    key: Joi.string().when('category', {
                        is: 'stuff',
                        then: Joi.forbidden(), // https://github.com/glennjones/hapi-swagger/issues/338
                    }),
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
    },
    ];


    lab.test('x-alternatives', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

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
                    '$ref': '#/definitions/Alt'
                },
                'x-alternatives': [
                    {
                        '$ref': '#/x-alt-definitions/alt1'
                    },
                    {
                        '$ref': '#/x-alt-definitions/alt2'
                    }
                ]
            }
        ]);


        expect(response.result.paths['/store2/'].post.responses).to.equal({
            '200': {
                'schema': {
                    '$ref': '#/definitions/Alt',
                    'x-alternatives': [
                        {
                            '$ref': '#/x-alt-definitions/alt1'
                        },
                        {
                            '$ref': '#/x-alt-definitions/alt2'
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
                    'x-alternatives': [
                        {
                            '$ref': '#/x-alt-definitions/Dimensions'
                        }
                    ]
                }
            }
        });

        // test full swagger document
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });



    lab.test('no x-alternatives', async() => {
        const server = await Helper.createServer({ xProperties: false }, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });

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
                    '$ref': '#/definitions/Alt'
                }
            }
        ]);

        expect(response.result.paths['/store4/'].post.parameters).to.equal([
            {
                'in': 'body',
                'name': 'body',
                'schema': {
                    '$ref': '#/definitions/Model 1'
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
                        '$ref': '#/definitions/Dimensions'
                    }
                },
                'type': 'object'
            }
        });


        // test full swagger document
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();


    });
});
