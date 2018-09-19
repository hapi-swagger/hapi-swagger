const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../helper.js');
const Defaults = require('../../lib/defaults.js');
const Responses = require('../../lib/responses.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());
const responses = new Responses(Defaults);

lab.experiment('responses', () => {
    const headers = {
        'X-Rate-Limit-Limit': {
            description: 'The number of allowed requests in the current period',
            type: 'integer'
        },
        'X-Rate-Limit-Remaining': {
            description:
                'The number of remaining requests in the current period',
            type: 'integer'
        },
        'X-Rate-Limit-Reset': {
            description: 'The number of seconds left in the current period',
            type: 'integer'
        }
    };

    const examples = {
        'application/json': {
            a: 5,
            b: 5,
            operator: '+',
            equals: 10
        }
    };

    const err400 = Joi.object()
        .description('Bad Request')
        .meta({ headers: headers, examples: examples });
    const err404 = Joi.object()
        .description('Unsupported Media Type')
        .meta({ headers: headers, examples: examples });
    const err429 = Joi.object()
        .description('Too Many Requests')
        .meta({ headers: headers, examples: examples });
    const err500 = Joi.object()
        .description('Internal Server Error')
        .meta({ headers: headers, examples: examples });

    const joiSumModel = Joi.object({
        id: Joi.string().required().example('x78P9c'),
        a: Joi.number().required().example(5),
        b: Joi.number().required().example(5),
        operator: Joi.string()
            .required()
            .description('either +, -, /, or *')
            .example('+'),
        equals: Joi.number().required().example(10),
        created: Joi.string()
            .required()
            .isoDate()
            .description('ISO date string')
            .example('2015-12-01'),
        modified: Joi.string()
            .isoDate()
            .description('ISO date string')
            .example('2015-12-01')
    })
        .description('json body for sum')
        .label('Sum');

    const joiListModel = Joi.object({
        items: Joi.array().items(joiSumModel),
        count: Joi.number().required(),
        pageSize: Joi.number().required(),
        page: Joi.number().required(),
        pageCount: Joi.number().required()
    }).label('List');

    const standardHTTP = {
        '200': {
            description: 'Success',
            schema: joiSumModel,
            headers: headers
        },
        '400': {
            description: 'Bad Request',
            headers: headers
        },
        '429': {
            description: 'Too Many Requests',
            headers: headers
        },
        '500': {
            description: 'Internal Server Error',
            headers: headers
        }
    };

    lab.test('using hapi response.schema', async() => {
        const routes = {
            method: 'POST',
            path: '/store/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: {
                        a: Joi.number()
                            .required()
                            .description('the first number')
                    }
                },
                payload: {
                    maxBytes: 1048576,
                    parse: true,
                    output: 'stream'
                },
                response: { schema: joiSumModel }
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(
            response.result.paths['/store/'].post.responses
        ).to.exist();
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test(
        'conditional variables produce `required = true`, not `required = [...]`',
        async() => {
            const routes = {
                method: 'POST',
                path: '/store/',
                config: {
                    handler: Helper.defaultHandler,
                    tags: ['api'],
                    validate: {
                        query: {
                            nonce: Joi.string().when('response_type', {
                                is: /^id_token( token)?$/,
                                then: Joi.required()
                            }),
                            response_type: Joi.string()
                                .allow('code', 'id_token token', 'id_token')
                                .required()
                        }
                    }
                }
            };

            const server = await Helper.createServer({}, routes);
            const response = await server.inject({ url: '/swagger.json' });
            expect(
                response.result.paths['/store/'].post.parameters[0]
                    .required
            ).to.equal(true);
            const isValid = await Validate.test(response.result);
            expect(isValid).to.be.true();
        }
    );

    lab.test('using hapi response.schema with child objects', async() => {
        const routes = {
            method: 'POST',
            path: '/store/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: {
                        a: Joi.number()
                            .required()
                            .description('the first number')
                    }
                },
                payload: {
                    maxBytes: 1048576,
                    parse: true,
                    output: 'stream'
                },
                response: { schema: joiListModel }
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(response.result.definitions.List).to.exist();
        expect(response.result.definitions.Sum).to.exist();
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('using hapi response.status', async() => {
        const routes = {
            method: 'POST',
            path: '/store/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: {
                        a: Joi.number()
                            .required()
                            .description('the first number')
                    }
                },
                response: {
                    status: {
                        200: joiSumModel,
                        400: err400,
                        404: err404,
                        429: err429,
                        500: err500
                    }
                }
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(
            response.result.paths['/store/'].post.responses[200]
        ).to.exist();
        expect(
            response.result.paths['/store/'].post.responses[400]
                .description
        ).to.equal('Bad Request');
        expect(
            response.result.paths['/store/'].post.responses[400].headers
        ).to.equal(headers);
        expect(
            response.result.paths['/store/'].post.responses[400]
                .examples
        ).to.equal(examples);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('using hapi response.status without 200', async() => {
        const routes = {
            method: 'POST',
            path: '/store/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: {
                        a: Joi.number()
                            .required()
                            .description('the first number')
                    }
                },
                response: {
                    status: {
                        400: err400,
                        404: err404,
                        429: err429,
                        500: err500
                    }
                }
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(
            response.result.paths['/store/'].post.responses[200]
        ).to.equal(undefined);
        expect(
            response.result.paths['/store/'].post.responses[400]
                .description
        ).to.equal('Bad Request');
        expect(
            response.result.paths['/store/'].post.responses[400].headers
        ).to.equal(headers);
        expect(
            response.result.paths['/store/'].post.responses[400]
                .examples
        ).to.equal(examples);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('using route base plugin override - object', async() => {
        const routes = {
            method: 'POST',
            path: '/store/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        responses: standardHTTP
                    }
                },
                validate: {
                    payload: {
                        a: Joi.number()
                            .required()
                            .description('the first number')
                    }
                }
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(
            response.result.paths['/store/'].post.responses[200].schema
        ).to.exist();
        expect(
            response.result.paths['/store/'].post.responses[400]
                .description
        ).to.equal('Bad Request');
        expect(
            response.result.paths['/store/'].post.responses[400].headers
        ).to.equal(headers);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('using route merging response and plugin override', async() => {
        const routes = {
            method: 'POST',
            path: '/store/',
            handler: Helper.defaultHandler,
            config: {
                tags: ['api'],
                response: {
                    schema: Joi.object()
                        .keys({ test: Joi.string() })
                        .label('Result')
                },
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                description: 'Success its a 200',
                                'x-meta': 'x-meta test data'
                            }
                        }
                    }
                }
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(
            response.result.paths['/store/'].post.responses[200].schema
        ).to.exist();
        expect(
            response.result.paths['/store/'].post.responses[200]
                .description
        ).to.equal('Success its a 200');
        expect(
            response.result.paths['/store/'].post.responses[200][
                'x-meta'
            ]
        ).to.equal('x-meta test data');
        expect(
            response.result.paths['/store/'].post.responses[200].schema
        ).to.equal({
            $ref: '#/definitions/Result'
        });
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test(
        'test a default response description is provided when no description is given',
        async() => {
            const routes = {
                method: 'POST',
                path: '/store/',
                handler: Helper.defaultHandler,
                config: {
                    tags: ['api'],
                    plugins: {
                        'hapi-swagger': {
                            responses: {
                                '200': {
                                    'x-meta': 'x-meta test data'
                                }
                            }
                        }
                    }
                }
            };

            const server = await Helper.createServer({}, routes);
            const response = await server.inject({ url: '/swagger.json' });
            expect(
                response.result.paths['/store/'].post.responses[200]
                    .description
            ).to.equal('Successful');
            const isValid = await Validate.test(response.result);
            expect(isValid).to.be.true();
        }
    );

    lab.test('using route base plugin override - array', async() => {
        const routes = {
            method: 'POST',
            path: '/store/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                description: 'Success',
                                schema: Joi.array()
                                    .items(
                                        Joi.object({
                                            equals: Joi.number()
                                        }).label('HTTP200Items')
                                    )
                                    .label('HTTP200')
                            },
                            '400': {
                                description: 'Bad Request',
                                schema: Joi.array()
                                    .items(
                                        Joi.object({
                                            equals: Joi.string()
                                        })
                                    )
                                    .label('HTTP400')
                            }
                        }
                    }
                },
                validate: {
                    payload: Joi.object({
                        a: Joi.number()
                            .required()
                            .description('the first number')
                    }).label('Payload')
                }
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(
            response.result.paths['/store/'].post.responses[200]
        ).to.equal({
            description: 'Success',
            schema: {
                $ref: '#/definitions/HTTP200'
            }
        });
        expect(response.result.definitions.HTTP200).to.equal({
            type: 'array',
            items: {
                $ref: '#/definitions/HTTP200Items'
            }
        });
        expect(response.result.definitions.HTTP200Items).to.equal({
            type: 'object',
            properties: {
                equals: {
                    type: 'number'
                }
            }
        });
        expect(
            response.result.paths['/store/'].post.responses[400]
                .description
        ).to.equal('Bad Request');
        expect(response.result.definitions.HTTP400).exists();
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('failback to 200', async() => {
        const routes = {
            method: 'POST',
            path: '/store/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: {
                        a: Joi.number()
                            .required()
                            .description('the first number')
                    }
                }
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(
            response.result.paths['/store/'].post.responses
        ).to.equal({
            default: {
                schema: {
                    type: 'string'
                },
                description: 'Successful'
            }
        });
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('No ownProperty', async() => {
        let objA = Helper.objWithNoOwnProperty();
        const objB = Helper.objWithNoOwnProperty();
        const objC = Helper.objWithNoOwnProperty();

        //console.log(JSON.stringify( Responses.build({},{},{},{}) ));

        expect(responses.build({}, {}, {}, {})).to.equal({
            default: {
                schema: {
                    type: 'string'
                },
                description: 'Successful'
            }
        });
        expect(responses.build(objA, objB, objC, {})).to.equal({
            default: {
                schema: {
                    type: 'string'
                },
                description: 'Successful'
            }
        });

        objA = { 200: { description: 'Successful' } };
        //console.log(JSON.stringify( Responses.build(objA, objB, objC, {}) ));
        expect(responses.build(objA, objB, objC, {})).to.equal({
            '200': {
                schema: {
                    type: 'string'
                },
                description: 'Successful'
            }
        });

    });

    lab.test('with same path but different method', async() => {
        const routes = [
            {
                method: 'POST',
                path: '/path/two',
                config: {
                    tags: ['api'],
                    handler: Helper.defaultHandler,
                    response: {
                        schema: {
                            value1111: Joi.boolean()
                        }
                    }
                }
            },
            {
                method: 'GET',
                path: '/path/two',
                config: {
                    tags: ['api'],
                    handler: Helper.defaultHandler,
                    response: {
                        schema: Joi.object({
                            value2222: Joi.boolean()
                        })
                    }
                }
            }
        ];

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(response.result.definitions['Model 1']).to.exist();
        expect(response.result.definitions['Model 2']).to.exist();
        expect(response.result.definitions).to.equal({
            'Model 1': {
                type: 'object',
                properties: {
                    value2222: {
                        type: 'boolean'
                    }
                }
            },
            'Model 2': {
                type: 'object',
                properties: {
                    value1111: {
                        type: 'boolean'
                    }
                }
            }
        });
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('with deep labels', async() => {
        const routes = [
            {
                method: 'POST',
                path: '/path/two',
                config: {
                    tags: ['api'],
                    handler: Helper.defaultHandler,
                    response: {
                        schema: Joi.object({
                            value1111: Joi.boolean()
                        }).label('labelA')
                    }
                }
            }
        ];

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(response.result.definitions.labelA).to.exist();
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('array with required #249', async() => {
        const dataPointSchema = Joi.object()
            .keys({
                date: Joi.date().required(),
                value: Joi.number().required()
            })
            .label('datapoint')
            .required();

        const exampleSchema = Joi.array()
            .items(dataPointSchema)
            .label('datapointlist')
            .required();

        const routes = [
            {
                method: 'POST',
                path: '/path/two',
                config: {
                    tags: ['api'],
                    handler: Helper.defaultHandler,
                    response: { schema: exampleSchema }
                }
            }
        ];

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(response.result.definitions.datapoint).to.exist();
        expect(response.result.definitions).to.equal({
            datapoint: {
                properties: {
                    date: {
                        type: 'string',
                        format: 'date'
                    },
                    value: {
                        type: 'number'
                    }
                },
                required: ['date', 'value'],
                type: 'object'
            },
            datapointlist: {
                type: 'array',
                items: {
                    $ref: '#/definitions/datapoint'
                },
                required: ['datapoint']
            }
        });
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('replace example with x-example for response', async() => {
        const dataPointSchema = Joi.object()
            .keys({
                date: Joi.date().required().example('2016-08-26'),
                value: Joi.number().required().example('1024')
            })
            .label('datapoint')
            .required();

        const exampleSchema = Joi.array()
            .items(dataPointSchema)
            .label('datapointlist')
            .required();

        const routes = [
            {
                method: 'POST',
                path: '/path/two',
                config: {
                    tags: ['api'],
                    handler: Helper.defaultHandler,
                    response: { schema: exampleSchema }
                }
            }
        ];

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(response.result.definitions.datapoint).to.exist();
        expect(response.result.definitions).to.equal({
            datapoint: {
                properties: {
                    date: {
                        type: 'string',
                        format: 'date',
                        example: '2016-08-26'
                    },
                    value: {
                        type: 'number',
                        example: '1024'
                    }
                },
                required: ['date', 'value'],
                type: 'object'
            },
            datapointlist: {
                type: 'array',
                items: {
                    $ref: '#/definitions/datapoint'
                },
                required: ['datapoint']
            }
        });
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('using hapi response.schema and plugin ', async() => {
        const routes = {
            method: 'POST',
            path: '/store/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                description: 'Success with response.schema'
                            }
                        }
                    }
                },
                response: { schema: joiListModel }
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(response.result.paths).to.equal({
            '/store/': {
                post: {
                    operationId: 'postStore',
                    tags: ['store'],
                    responses: {
                        '200': {
                            schema: {
                                $ref: '#/definitions/List'
                            },
                            description: 'Success with response.schema'
                        }
                    }
                }
            }
        });
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('using hapi response.schema and plugin mismatch', async() => {
        const routes = {
            method: 'POST',
            path: '/store/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '404': {
                                description: 'Could not find a schema'
                            }
                        }
                    }
                },
                response: { schema: joiListModel }
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(response.result.paths).to.equal({
            '/store/': {
                post: {
                    operationId: 'postStore',
                    tags: ['store'],
                    responses: {
                        '200': {
                            schema: {
                                $ref: '#/definitions/List'
                            },
                            description: 'Successful'
                        },
                        '404': {
                            description: 'Could not find a schema'
                        }
                    }
                }
            }
        });
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('using hapi response.schema and plugin mismatch', async() => {
        const routes = {
            method: 'POST',
            path: '/store/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                description: 'Success with response.schema',
                                schema: joiSumModel
                            }
                        }
                    }
                },
                response: { schema: joiListModel }
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(response.result.paths).to.equal({
            '/store/': {
                post: {
                    operationId: 'postStore',
                    tags: ['store'],
                    responses: {
                        '200': {
                            schema: {
                                $ref: '#/definitions/Sum'
                            },
                            description: 'Success with response.schema'
                        }
                    }
                }
            }
        });
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();

    });

    lab.test('using hapi response.schema and plugin mixed results', async() => {
        const routes = {
            method: 'POST',
            path: '/store/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '400': {
                                description: '400 - Added from plugin-options'
                            },
                            '404': {
                                schema: Joi.object({ err: Joi.string() })
                            },
                            '500': {
                                description: '500 - Added from plugin-options'
                            }
                        }
                    }
                },
                response: {
                    status: {
                        200: joiSumModel,
                        400: Joi.object({ err: Joi.string() }),
                        404: Joi.object({ err: Joi.string() }).description(
                            '404 from response status object'
                        ),
                        429: Joi.object({ err: Joi.string() })
                    }
                }
            }
        };

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ url: '/swagger.json' });
        expect(response.result.paths).to.equal({
            '/store/': {
                post: {
                    operationId: 'postStore',
                    tags: ['store'],
                    responses: {
                        '200': {
                            description: 'json body for sum',
                            schema: {
                                $ref: '#/definitions/Sum'
                            }
                        },
                        '400': {
                            schema: {
                                $ref: '#/definitions/Model 1'
                            },
                            description:
                                '400 - Added from plugin-options'
                        },
                        '404': {
                            description:
                                '404 from response status object',
                            schema: {
                                $ref: '#/definitions/Model 1'
                            }
                        },
                        '429': {
                            schema: {
                                $ref: '#/definitions/Model 1'
                            },
                            description: 'Too Many Requests'
                        },
                        '500': {
                            description:
                                '500 - Added from plugin-options'
                        }
                    }
                }
            }
        });
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });
});
