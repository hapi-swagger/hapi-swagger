'use strict';
const Code = require('code');
const Hapi = require('hapi');
const Inert = require('inert');
const Joi = require('joi');
const Lab = require('lab');
const Vision = require('vision');
const HapiSwagger = require('../lib/index.js');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('index', () => {

    const routes = [{
        method: 'POST',
        path: '/store/',
        config: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: {
                    a: Joi.number(),
                    b: Joi.number(),
                    operator: Joi.string(),
                    equals: Joi.number()
                }
            }
        }
    }];


    lab.test('plug-in register no vision dependency', (done) => {

        try {
            var server = new Hapi.Server();
            server.connection();
            server.register([
                Inert,
                HapiSwagger
            ], function (err) {

                server.start(function (err) {
                });
            });
            server.route(routes);
        } catch (err) {
            expect(err.message).to.equal('Missing vision plug-in registation');
            done();
        }
    });


    lab.test('plug-in register no inert dependency', (done) => {

        try {
            const server = new Hapi.Server();
            server.connection();
            server.register([
                Vision,
                HapiSwagger
            ], function (err) {

                server.start(function (err) {
                });
            });
            server.route(routes);
        } catch (err) {
            expect(err.message).to.equal('Missing inert plug-in registation');
            done();
        }
    });


    lab.test('plug-in register no options', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.register([
            Inert,
            Vision,
            HapiSwagger
        ], function (err) {

            server.start(function (err) {

                expect(err).to.equal(undefined);
                done();
            });
        });
        server.route(routes);
    });




    lab.test('plug-in register test', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths).to.have.length(1);
                done();
            });

        });
    });


    Helper.createServer({}, routes, (err, server) => {

        expect(err).to.equal(null);
        lab.test('default jsonPath url', (done) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });

        lab.test('default documentationPath url', (done) => {

            server.inject({ method: 'GET', url: '/documentation' }, function (response) {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });

        lab.test('default swaggerUIPath url', (done) => {

            server.inject({ method: 'GET', url: '/swaggerui/swagger-ui.js' }, function (response) {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });

    });


    let swaggerOptions = {
        'jsonPath': '/test.json',
        'documentationPath': '/testdoc',
        'swaggerUIPath': '/testui/'
    };


    Helper.createServer(swaggerOptions, routes, (err, server) => {

        expect(err).to.equal(null);
        lab.test('repathed jsonPath url', (done) => {

            server.inject({ method: 'GET', url: '/test.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });

        lab.test('repathed documentationPath url', (done) => {

            server.inject({ method: 'GET', url: '/testdoc' }, function (response) {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });

        lab.test('repathed swaggerUIPath url', (done) => {

            server.inject({ method: 'GET', url: '/testui/swagger-ui.js' }, function (response) {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });

    });


    lab.test('disable documentation path', (done) => {

        swaggerOptions = {
            'enableDocumentation': false
        };

        Helper.createServer(swaggerOptions, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/documentation' }, function (response) {

                expect(response.statusCode).to.equal(404);
                done();
            });
        });
    });


    lab.test('payloadType = form global', (done) => {

        swaggerOptions = {
            'payloadType': 'json'
        };

        Helper.createServer(swaggerOptions, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                //console.log(JSON.stringify(response.result));
                expect(response.result.paths['/store/'].post.parameters.length).to.equal(1);
                expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('body');
                done();
            });

        });
    });


    lab.test('payloadType = json global', (done) => {

        swaggerOptions = {
            'payloadType': 'form'
        };

        Helper.createServer(swaggerOptions, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                //console.log(JSON.stringify(response.result));
                expect(response.result.paths['/store/'].post.parameters.length).to.equal(4);
                expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('a');
                done();
            });

        });
    });


    lab.test('pathPrefixSize global', (done) => {

        swaggerOptions = {
            'pathPrefixSize': 2
        };

        const prefixRoutes = [{
            method: 'GET',
            path: '/foo/bar/extra',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api']
            }
        }];

        Helper.createServer(swaggerOptions, prefixRoutes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/foo/bar/extra'].get.tags[0]).to.equal('foo/bar');
                done();
            });

        });
    });


    lab.test('expanded none', (done) => {

        // TODO find a way to test impact of property change
        Helper.createServer({ 'expanded': 'none' }, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });


    lab.test('expanded list', (done) => {

        Helper.createServer({ 'expanded': 'list' }, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });


    lab.test('expanded full', (done) => {

        Helper.createServer({ 'expanded': 'full' }, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });


    lab.test('pass through of tags querystring', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/documentation?tags=reduced' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.indexOf('swagger.json?tags=reduced') > -1).to.equal(true);
                done();
            });

        });
    });





});
