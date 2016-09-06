'use strict';
const Code = require('code');
const Joi = require('joi');
const Hoek = require('hoek');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('path', () => {

    let routes = {
        method: 'POST',
        path: '/test',
        handler: Helper.defaultHandler,
        config: {
            description: 'Add sum',
            notes: ['Adds a sum to the data store'],
            tags: ['api'],
            validate: {
                payload: {
                    a: Joi.number()
                        .required()
                        .description('the first number').default(10),

                    b: Joi.number()
                        .required()
                        .description('the second number'),

                    operator: Joi.string()
                        .required()
                        .default('+')
                        .valid(['+', '-', '/', '*'])
                        .description('the opertator i.e. + - / or *'),

                    equals: Joi.number()
                        .required()
                        .description('the result of the sum')
                }
            }
        }
    };


    lab.test('summary and description', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.summary).to.equal('Add sum');
                expect(response.result.paths['/test'].post.description).to.equal('Adds a sum to the data store');
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('description as an array', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.notes = ['note one', 'note two'];
        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.description).to.equal('note one<br/><br/>note two');
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('route settting of consumes produces', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.plugins = {
            'hapi-swagger': {
                consumes: ['application/x-www-form-urlencoded'],
                produces: ['application/json', 'application/xml']
            }
        };

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result.paths['/test'].post.consumes));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.consumes).to.equal(['application/x-www-form-urlencoded']);
                expect(response.result.paths['/test'].post.produces).to.equal(['application/json', 'application/xml']);
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('override plug-in settting of consumes produces', (done) => {

        let swaggerOptions = {
            consumes: ['application/json'],
            produces: ['application/json']
        };

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.plugins = {
            'hapi-swagger': {
                consumes: ['application/x-www-form-urlencoded'],
                produces: ['application/json', 'application/xml']
            }
        };

        Helper.createServer(swaggerOptions, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.consumes).to.equal(['application/x-www-form-urlencoded']);
                expect(response.result.paths['/test'].post.produces).to.equal(['application/json', 'application/xml']);
                Helper.validate(response, done, expect);
            });
        });
    });




    lab.test('auto "x-www-form-urlencoded" consumes with payloadType', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.plugins = {
            'hapi-swagger': {
                payloadType: 'form'
            }
        };

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.consumes).to.equal(['application/x-www-form-urlencoded']);
                Helper.validate(response, done, expect);
            });
        });
    });



    lab.test('rename a parameter', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.plugins = {
            'hapi-swagger': {
                payloadType: 'form'
            }
        };
        testRoutes.config.validate.payload = Joi.object({ a: Joi.string().label('foo') });

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.parameters).to.equal([
                    {
                        'type': 'string',
                        'name': 'a',
                        'in': 'formData'
                    }
                ]);
                Helper.validate(response, done, expect);
            });
        });
    });



    lab.test('auto "multipart/form-data" consumes with { swaggerType: "file" }', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.validate = {
            payload: {
                file: Joi.any()
                    .meta({ swaggerType: 'file' })
                    .description('json file')
            }
        },

            Helper.createServer({}, testRoutes, (err, server) => {

                server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                    expect(err).to.equal(null);
                    //console.log(JSON.stringify(response.result));
                    expect(response.statusCode).to.equal(200);
                    expect(response.result.paths['/test'].post.consumes).to.equal(['multipart/form-data']);
                    done();
                });
            });
    });


    lab.test('auto "multipart/form-data" do not add two', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.validate = {
            payload: {
                file: Joi.any()
                    .meta({ swaggerType: 'file' })
                    .description('json file')
            }
        },
            testRoutes.config.plugins = {
                'hapi-swagger': {
                    consumes: ['multipart/form-data']
                }
            };

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.consumes).to.equal(['multipart/form-data']);
                done();
            });
        });
    });


    lab.test('auto "application/x-www-form-urlencoded" do not add two', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.validate = {
            payload: {
                file: Joi.string()
                    .description('json file')
            }
        },
            testRoutes.config.plugins = {
                'hapi-swagger': {
                    consumes: ['application/x-www-form-urlencoded']
                }
            };

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.consumes).to.equal(['application/x-www-form-urlencoded']);
                done();
            });
        });
    });



    lab.test('a user set content-type header removes consumes', (done) => {

        let consumes = [
            'application/json',
            'application/json;charset=UTF-8',
            'application/json; charset=UTF-8'];
        let testRoutes = Hoek.clone(routes);
        testRoutes.config.validate.headers = Joi.object({
            'content-type': Joi.string().valid(consumes)
        }).unknown();


        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.consumes).to.not.exist();
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('payloadType form', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.plugins = {
            'hapi-swagger': {
                payloadType: 'form'
            }
        };

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.consumes).to.equal(['application/x-www-form-urlencoded']);
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('accept header', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.validate.headers = Joi.object({
            accept: Joi.string().required().valid(['application/json', 'application/vnd.api+json'])
        }).unknown();


        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.produces).to.equal(['application/json', 'application/vnd.api+json']);
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('accept header - no emum', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.validate.headers = Joi.object({
            accept: Joi.string().required().default('application/vnd.api+json')
        }).unknown();


        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.parameters[0]).to.equal({
                    'required': true,
                    'default': 'application/vnd.api+json',
                    'in': 'header',
                    'name': 'accept',
                    'type': 'string'
                });
                expect(response.result.paths['/test'].post.produces).to.not.exist();
                Helper.validate(response, done, expect);
            });
        });
    });



    lab.test('accept header - default first', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.validate.headers = Joi.object({
            accept: Joi.string().required().valid(['application/json', 'application/vnd.api+json']).default('application/vnd.api+json')
        }).unknown();


        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.produces).to.equal(['application/vnd.api+json', 'application/json']);
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('accept header acceptToProduce set to false', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.validate.headers = Joi.object({
            accept: Joi.string().required().valid(['application/json', 'application/vnd.api+json']).default('application/vnd.api+json')
        }).unknown();


        Helper.createServer({ 'acceptToProduce': false }, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.parameters[0]).to.equal({
                    'enum': [
                        'application/json',
                        'application/vnd.api+json'
                    ],
                    'required': true,
                    'default': 'application/vnd.api+json',
                    'in': 'header',
                    'name': 'accept',
                    'type': 'string'
                });
                expect(response.result.paths['/test'].post.produces).to.not.exist();
                Helper.validate(response, done, expect);
            });
        });
    });



    lab.test('path parameters {id}/{note?}', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.path = '/servers/{id}/{note?}';
        testRoutes.config.validate = {
            params: {
                id: Joi.number().integer().required().description('ID of server to delete'),
                note: Joi.string().description('Note..')
            }
        };

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/servers/{id}/{note}']).to.exist();
                done();
            });
        });
    });



    lab.test('path parameters {a}/{b?} required overriden by JOI', (done) => {

        let testRoutes = [{
            method: 'POST',
            path: '/server/1/{a}/{b?}',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    params: {
                        a: Joi.number().required(),
                        b: Joi.string().required()
                    }
                }
            }
        }, {
            method: 'POST',
            path: '/server/2/{c}/{d?}',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    params: {
                        c: Joi.number().optional(),
                        d: Joi.string().optional()
                    }
                }
            }
        }, {
            method: 'POST',
            path: '/server/3/{e}/{f?}',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    params: {
                        e: Joi.number(),
                        f: Joi.string()
                    }
                }
            }
        }];

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result.paths['/server/1/{a}/{b}'].post.parameters));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/server/1/{a}/{b}'].post.parameters).to.equal([
                    {
                        'type': 'number',
                        'name': 'a',
                        'in': 'path',
                        'required': true
                    },
                    {
                        'type': 'string',
                        'name': 'b',
                        'in': 'path',
                        'required': true
                    }
                ]);
                expect(response.result.paths['/server/2/{c}/{d}'].post.parameters).to.equal([
                    {
                        'type': 'number',
                        'in': 'path',
                        'name': 'c'
                    }, {
                        'type': 'string',
                        'in': 'path',
                        'name': 'd'
                    }]);
                expect(response.result.paths['/server/3/{e}/{f}'].post.parameters).to.equal([
                    {
                        'required': true,
                        'type': 'number',
                        'in': 'path',
                        'name': 'e'
                    }, {
                        'type': 'string',
                        'in': 'path',
                        'name': 'f'
                    }]);
                done();
            });
        });
    });


    lab.test('path and basePath', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.path = '/v3/servers';
        testRoutes.config.validate = {
            params: {
                id: Joi.number().integer().required().description('ID of server to delete'),
                note: Joi.string().description('Note..')
            }
        };

        Helper.createServer({ basePath: '/v3' }, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/servers']).to.exist();
                done();
            });
        });
    });


    lab.test('basePath trim tailing slash', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.path = '/v3/servers';
        testRoutes.config.validate = {
            params: {
                id: Joi.number().integer().required().description('ID of server to delete'),
                note: Joi.string().description('Note..')
            }
        };

        Helper.createServer({ basePath: '/v3/' }, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/servers']).to.exist();
                done();
            });
        });
    });


    lab.test('path, basePath suppressing version fragment', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.path = '/api/v3/servers';
        testRoutes.config.validate = {
            params: {
                id: Joi.number().integer().required().description('ID of server to delete'),
                note: Joi.string().description('Note..')
            }
        };


        const options = {
            basePath: '/api',
            pathReplacements: [{
                replaceIn: 'all',
                pattern: /v([0-9]+)\//,
                replacement: ''
            }]
        };


        Helper.createServer(options, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/servers']).to.exist();
                done();
            });
        });
    });


    lab.test('route deprecated', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.plugins = {
            'hapi-swagger': {
                deprecated: true
            }
        };

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.deprecated).to.equal(true);
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('custom operationId for code-gen apps', (done) => {

        let testRoutes = Hoek.clone(routes);
        testRoutes.config.plugins = {
            'hapi-swagger': {
                id: 'add'
            }
        };

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].post.operationId).to.equal('add');
                Helper.validate(response, done, expect);
            });
        });
    });



    lab.test('stop boolean creating parameter', (done) => {

        let testRoutes = {
            method: 'GET',
            path: '/{name}',
            config: {
                handler: () => {},
                tags: ['api'],
                validate: {
                    headers: true,
                    params: {
                        name: Joi.string().min(2)
                    },
                    query: false
                }
            }
        };


        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/{name}'].get.parameters).to.equal([
                    {
                        'type': 'string',
                        'minLength': 2,
                        'name': 'name',
                        'in': 'path',
                        'required': true
                    }
                ]);
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('stop emtpy objects creating parameter', (done) => {

        let testRoutes = {
            method: 'POST',
            path: '/{name}',
            config: {
                handler: () => { },
                tags: ['api'],
                validate: {
                    payload: Joi.object()
                }
            }
        };

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result.paths['/{name}'].post.parameters));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/{name}'].post.parameters).to.equal([
                    {
                        'in': 'body',
                        'name': 'body',
                        'schema': {
                            'type': 'object',
                            '$ref': '#/definitions/Model 1'
                        }
                    }
                ]);


                Validate.test(response.result, (err) => {
                    expect(err).to.equal('Validation failed. /paths/{name}/post is missing path parameter(s) for {name}');
                    done();
                });
            });
        });
    });



    lab.test('stop emtpy formData object creating parameter', (done) => {

        let testRoutes = {
            method: 'POST',
            path: '/',
            config: {
                handler: () => { },
                tags: ['api'],
                validate: {
                    payload: Joi.object()
                },
                plugins: {
                    'hapi-swagger': {
                        payloadType: 'form'
                    }
                }
            }
        };


        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/'].post.parameters).to.not.exists();

                Helper.validate(response, done, expect);
            });
        });
    });

});
