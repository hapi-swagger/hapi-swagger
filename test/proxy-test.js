'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('proxies', () => {

    const requestOptions = {
        method: 'GET',
        url: '/swagger.json',
        headers: {
            host: 'localhost'
        }
    };

    let routes = {
        method: 'GET',
        path: '/test',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    };



    lab.test('basePath option', (done) => {

        const options = {
            basePath: '/v2'
        };

        Helper.createServer(options, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.basePath).to.equal(options.basePath);
                done();
            });
        });
    });


    lab.test('schemes and host options', (done) => {

        const options = {
            schemes: ['https'],
            host: 'testhost'
        };

        Helper.createServer(options, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.result.host).to.equal(options.host);
                expect(response.result.schemes).to.deep.equal(options.schemes);
                done();
            });
        });
    });


    lab.test('x-forwarded options', (done) => {

        const options = {};

        requestOptions.headers = {
            'x-forwarded-host': 'proxyhost',
            'x-forwarded-proto': 'https'
        };

        Helper.createServer(options, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.result.host).to.equal(requestOptions.headers['x-forwarded-host']);
                expect(response.result.schemes).to.deep.equal(['https']);
                done();
            });
        });
    });


    lab.test('adding facade for proxy using route options 1', (done) => {

        routes = {
            method: 'POST',
            path: '/tools/microformats/',
            config: {
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        nickname: 'microformatsapi',
                        validate: {
                            payload: {
                                a: Joi.number()
                                    .required()
                                    .description('the first number'),
                                b: Joi.number()
                                    .required()
                                    .description('the first number')
                            },
                            query: {
                                testquery: Joi.string()
                            },
                            params: {
                                testparam: Joi.string()
                            },
                            headers: {
                                testheaders: Joi.string()
                            }
                        }
                    }
                },
                handler: {
                    proxy: {
                        host: 'glennjones.net',
                        protocol: 'http',
                        onResponse: Helper.replyWithJSON
                    }
                }
            }
        };

        Helper.createServer({}, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result.paths['/tools/microformats/'].post.parameters));
                //console.log(JSON.stringify(response.result));
                expect(response.result.paths['/tools/microformats/'].post.parameters).to.deep.equal([
                    {
                        'type': 'string',
                        'in': 'header',
                        'name': 'testheaders'
                    },
                    {
                        'type': 'string',
                        'in': 'path',
                        'name': 'testparam'
                    },
                    {
                        'type': 'string',
                        'in': 'query',
                        'name': 'testquery'
                    },
                    {
                        'in': 'body',
                        'name': 'body',
                        'schema': {
                            '$ref': '#/definitions/parameters_microformatsapi_post'
                        }
                    }
                ]);
                done();
            });
        });
    });


    lab.test('adding facade for proxy using route options 2 - naming', (done) => {

        routes = {
            method: 'POST',
            path: '/tools/microformats/',
            config: {
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        nickname: 'microformatsapi',
                        validate: {
                            payload: Joi.object({
                                a: Joi.number()
                                    .required()
                                    .description('the first number')
                            }).label('testname')
                        }
                    }
                },
                handler: {
                    proxy: {
                        host: 'glennjones.net',
                        protocol: 'http',
                        onResponse: Helper.replyWithJSON
                    }
                }
            }
        };

        Helper.createServer({}, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result.paths['/tools/microformats/'].post.parameters));
                //console.log(JSON.stringify(response.result));
                expect(response.result.paths['/tools/microformats/'].post.parameters).to.deep.equal([
                    {
                        'in': 'body',
                        'name': 'body',
                        'schema': {
                            '$ref': '#/definitions/testname'
                        }
                    }
                ]);
                done();
            });
        });
    });


    lab.test('adding facade for proxy using route options 3 - defination reuse', (done) => {

        routes = [{
            method: 'POST',
            path: '/tools/microformats/1',
            config: {
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        nickname: 'microformatsapi1',
                        validate: {
                            payload: Joi.object({
                                a: Joi.number()
                                    .required()
                                    .description('the first number')
                            }).label('testname')
                        }
                    }
                },
                handler: {
                    proxy: {
                        host: 'glennjones.net',
                        protocol: 'http',
                        onResponse: Helper.replyWithJSON
                    }
                }
            }
        }, {
            method: 'POST',
            path: '/tools/microformats/2',
            config: {
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        nickname: 'microformatsapi2',
                        validate: {
                            payload: Joi.object({
                                a: Joi.number()
                                    .required()
                                    .description('the first number')
                            }).label('testname')
                        }
                    }
                },
                handler: {
                    proxy: {
                        host: 'glennjones.net',
                        protocol: 'http',
                        onResponse: Helper.replyWithJSON
                    }
                }
            }
        }];

        Helper.createServer({}, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result.paths['/tools/microformats/'].post.parameters));
                //console.log(JSON.stringify(response.result));
                expect(response.result.definitions).to.deep.equal({
                    'testname': {
                        'properties': {
                            'a': {
                                'type': 'number',
                                'description': 'the first number'
                            }
                        },
                        'required': [
                            'a'
                        ],
                        'type': 'object'
                    }
                });

                done();
            });
        });
    });



    lab.test('adding facade for proxy using route options 4 - defination name clash', (done) => {

        routes = [{
            method: 'POST',
            path: '/tools/microformats/1',
            config: {
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        nickname: 'microformatsapi1',
                        validate: {
                            payload: Joi.object({
                                a: Joi.number()
                                    .required()
                                    .description('the first number')
                            }).label('testname')
                        }
                    }
                },
                handler: {
                    proxy: {
                        host: 'glennjones.net',
                        protocol: 'http',
                        onResponse: Helper.replyWithJSON
                    }
                }
            }
        }, {
            method: 'POST',
            path: '/tools/microformats/2',
            config: {
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        nickname: 'microformatsapi2',
                        validate: {
                            payload: Joi.object({
                                b: Joi.string()
                                    .description('the string')
                            }).label('testname')
                        }
                    }
                },
                handler: {
                    proxy: {
                        host: 'glennjones.net',
                        protocol: 'http',
                        onResponse: Helper.replyWithJSON
                    }
                }
            }
        }];

        Helper.createServer({}, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result.paths['/tools/microformats/'].post.parameters));
                //console.log(JSON.stringify(response.result));
                expect(response.result.definitions).to.deep.equal({
                    'testname': {
                        'properties': {
                            'a': {
                                'type': 'number',
                                'description': 'the first number'
                            }
                        },
                        'required': [
                            'a'
                        ],
                        'type': 'object'
                    },
                    'parameters_microformatsapi2_post': {
                        'properties': {
                            'b': {
                                'type': 'string',
                                'description': 'the string'
                            }
                        },
                        'type': 'object'
                    }
                });
                done();
            });
        });
    });

});
