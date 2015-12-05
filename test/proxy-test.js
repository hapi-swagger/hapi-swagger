'use strict';
var Code = require('code'),
    Joi = require('joi'),
    Lab = require('lab');

var Helper = require('../test/helper.js');

var expect = Code.expect,
    lab = exports.lab = Lab.script();


lab.experiment('proxies', function () {

    var requestOptions = {
        method: 'GET',
        url: '/swagger.json',
        headers: {
            host: 'localhost'
        }
    };

    var routes = {
        method: 'GET',
        path: '/test',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    };



    lab.test('basePath option', function (done) {

        var options = {
            basePath: '/v2'
        };

        Helper.createServer(options, routes, function (err, server) {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.basePath).to.equal(options.basePath);
                done();
            });
        });
    });


    lab.test('schemes and host options', function (done) {

        var options = {
            schemes: ['https'],
            host: 'testhost'
        };

        Helper.createServer(options, routes, function (err, server) {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.result.host).to.equal(options.host);
                expect(response.result.schemes).to.deep.equal(options.schemes);
                done();
            });
        });
    });


    lab.test('x-forwarded options', function (done) {

        var options = {};

        requestOptions.headers = {
            'x-forwarded-host': 'proxyhost',
            'x-forwarded-proto': 'https'
        };

        Helper.createServer(options, routes, function (err, server) {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.result.host).to.equal(requestOptions.headers['x-forwarded-host']);
                expect(response.result.schemes).to.deep.equal(['https']);
                done();
            });
        });
    });


    lab.test('adding facade for proxy using route options 1', function (done) {

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

        Helper.createServer({}, routes, function (err, server) {

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
                            '$ref': '#/definitions/microformatsapi_payload'
                        },
                        'type': 'object'
                    }
                ]);
                done();
            });
        });
    });


    lab.test('adding facade for proxy using route options 2 - naming', function (done) {

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
                            }).meta({ className: 'testname' })
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

        Helper.createServer({}, routes, function (err, server) {

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
                        },
                        'type': 'object'
                    }
                ]);
                done();
            });
        });
    });


    lab.test('adding facade for proxy using route options 3 - defination reuse', function (done) {

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
                            }).meta({ className: 'testname' })
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
                            }).meta({ className: 'testname' })
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

        Helper.createServer({}, routes, function (err, server) {

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



    lab.test('adding facade for proxy using route options 4 - defination name clash', function (done) {

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
                            }).meta({ className: 'testname' })
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
                            }).meta({ className: 'testname' })
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

        Helper.createServer({}, routes, function (err, server) {

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
                    'microformatsapi2_payload': {
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
