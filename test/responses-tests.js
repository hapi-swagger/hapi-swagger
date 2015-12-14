'use strict';
var Code = require('code'),
    Joi = require('joi'),
    Lab = require('lab');

var Helper = require('../test/helper.js'),
    Responses = require('../lib/responses.js');

var expect = Code.expect,
    lab = exports.lab = Lab.script();


lab.experiment('responses', function () {

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

    var joiSumModel = Joi.object({
        id: Joi.string().required().example('x78P9c'),
        a: Joi.number().required().example(5),
        b: Joi.number().required().example(5),
        operator: Joi.string().required().description('either +, -, /, or *').example('+'),
        equals: Joi.number().required().example(10),
        created: Joi.string().required().isoDate().description('ISO date string').example('2015-12-01'),
        modified: Joi.string().isoDate().description('ISO date string').example('2015-12-01')
    }).description('json body for sum').meta({
        className: 'Sum'
    });

    var joiListModel = Joi.object({
        items: Joi.array().items(joiSumModel),
        count: Joi.number().required(),
        pageSize: Joi.number().required(),
        page: Joi.number().required(),
        pageCount: Joi.number().required()
    }).meta({
        className: 'List'
    });

    var standardHTTP = {
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

    var swaggerSumModel = {
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


    lab.test('using hapi response.schema', function (done) {

        var routes = {
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

        Helper.createServer({}, routes, function (err, server) {

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



    lab.test('using hapi response.schema with child objects', function (done) {

        var routes = {
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

        Helper.createServer({}, routes, function (err, server) {

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


    lab.test('using hapi response.status', function (done) {

        var routes = {
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

        Helper.createServer({}, routes, function (err, server) {

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



    lab.test('using hapi response.status without 200', function (done) {

        var routes = {
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

        Helper.createServer({}, routes, function (err, server) {

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


    lab.test('using route base override', function (done) {

        var routes = {
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

        Helper.createServer({}, routes, function (err, server) {

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


    lab.test('failback to default', function (done) {

        var routes = {
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

        Helper.createServer({}, routes, function (err, server) {

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


    lab.test('No ownProperty', function (done) {

        var objA = Helper.objWithNoOwnProperty(),
            objB = Helper.objWithNoOwnProperty(),
            objC = Helper.objWithNoOwnProperty();

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
