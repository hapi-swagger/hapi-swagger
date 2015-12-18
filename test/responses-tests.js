'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../test/helper.js');
const Responses = require('../lib/responses.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('responses', () => {

    const headers = {
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

    const example = {
        'application/json': {
            'a': 5,
            'b': 5,
            'operator': '+',
            'equals': 10
        }
    };

    const err400 = Joi.object().description('Bad Request').meta({ headers: headers, example: example });
    const err404 = Joi.object().description('Unsupported Media Type').meta({ headers: headers, example: example });
    const err429 = Joi.object().description('Too Many Requests').meta({ headers: headers, example: example });
    const err500 = Joi.object().description('Internal Server Error').meta({ headers: headers, example: example });

    const joiSumModel = Joi.object({
        id: Joi.string().required().example('x78P9c'),
        a: Joi.number().required().example(5),
        b: Joi.number().required().example(5),
        operator: Joi.string().required().description('either +, -, /, or *').example('+'),
        equals: Joi.number().required().example(10),
        created: Joi.string().required().isoDate().description('ISO date string').example('2015-12-01'),
        modified: Joi.string().isoDate().description('ISO date string').example('2015-12-01')
    }).description('json body for sum').label('Sum');

    const joiListModel = Joi.object({
        items: Joi.array().items(joiSumModel),
        count: Joi.number().required(),
        pageSize: Joi.number().required(),
        page: Joi.number().required(),
        pageCount: Joi.number().required()
    }).label('List');

    const standardHTTP = {
        '200': {
            'description': 'Success',
            'schema': joiSumModel,
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

    const swaggerSumModel = {
        'properties': {
            'id': {
                'type': 'string',
                'example': 'x78P9c'
            },
            'a': {
                'type': 'number',
                'example': 5
            },
            'b': {
                'type': 'number',
                'example': 5
            },
            'operator': {
                'type': 'string',
                'example': '+',
                'description': 'either +, -, /, or *'
            },
            'equals': {
                'type': 'number',
                'example': 10
            },
            'created': {
                'type': 'string',
                'example': '2015-12-01',
                'description': 'ISO date string'
            },
            'modified': {
                'type': 'string',
                'example': '2015-12-01',
                'description': 'ISO date string'
            }
        },
        'description': 'json body for sum',
        'required': [
            'id',
            'a',
            'b',
            'operator',
            'equals',
            'created'
        ],
        'type': 'object'
    };


    lab.test('using hapi response.schema', (done) => {

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

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.result.paths['/store/'].post.responses).to.deep.equal({
                    '200': {
                        'schema': {
                            '$ref': '#/definitions/Sum'
                        },
                        'description': 'Successful'
                    }
                });
                expect(response.result.definitions.Sum).to.deep.equal(swaggerSumModel);
                done();
            });
        });
    });



    lab.test('using hapi response.schema with child objects', (done) => {

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

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result.definitions.List.properties.items));
                expect(err).to.equal(null);
                expect(response.result.paths['/store/'].post.responses).to.deep.equal({
                    '200': {
                        'schema': {
                            '$ref': '#/definitions/List'
                        },
                        'description': 'Successful'
                    }
                });
                expect(response.result.definitions.List).to.exist();
                expect(response.result.definitions.Sum).to.exist();
                expect(response.result.definitions.List.properties.items.items.$ref).to.equal('#/definitions/Sum');
                done();
            });
        });
    });


    lab.test('using hapi response.status', (done) => {

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

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.result.paths['/store/'].post.responses[200]).to.deep.equal({
                    'schema': {
                        '$ref': '#/definitions/Sum'
                    },
                    'description': 'Successful'
                });
                expect(response.result.paths['/store/'].post.responses[400].description).to.equal('Bad Request');
                expect(response.result.paths['/store/'].post.responses[400].headers).to.deep.equal(headers);
                expect(response.result.paths['/store/'].post.responses[400].example).to.deep.equal(example);
                done();
            });
        });
    });



    lab.test('using hapi response.status without 200', (done) => {

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

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result.paths['/store/'].post.responses));
                expect(response.result.paths['/store/'].post.responses[200]).to.deep.equal(undefined);
                expect(response.result.paths['/store/'].post.responses[400].description).to.equal('Bad Request');
                expect(response.result.paths['/store/'].post.responses[400].headers).to.deep.equal(headers);
                expect(response.result.paths['/store/'].post.responses[400].example).to.deep.equal(example);
                done();
            });
        });
    });


    lab.test('using route base override', (done) => {

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

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.result.paths['/store/'].post.responses[200].schema).to.deep.equal({ '$ref': '#/definitions/Sum' });
                expect(response.result.paths['/store/'].post.responses[400].description).to.equal('Bad Request');
                expect(response.result.paths['/store/'].post.responses[400].headers).to.deep.equal(headers);
                done();
            });
        });
    });


    lab.test('failback to default', (done) => {

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

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.result.paths['/store/'].post.responses[200]).to.deep.equal({
                    'schema': {
                        'type': 'string'
                    },
                    'description': 'Successful'
                });
                done();
            });
        });
    });


    lab.test('No ownProperty', (done) => {

        const objA = Helper.objWithNoOwnProperty();
        const objB = Helper.objWithNoOwnProperty();
        const objC = Helper.objWithNoOwnProperty();

        //console.log(JSON.stringify( Responses.build({},{},{},{}) ));
        expect(Responses.build({}, {}, {}, {})).to.deep.equal({
            200: {
                'description': 'Successful'
            }
        });
        expect(Responses.build( objA,objB,objC,{ } )).to.deep.equal({
            200: {
                'description': 'Successful'
            }
        });
        objA[200] = { description : 'Successful' };
        expect(Responses.build( objA,objB,objC,{ } )).to.deep.equal({ 200:{ 'description': 'Successful' } });

        done();
    });


});
