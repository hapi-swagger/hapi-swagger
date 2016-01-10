'use strict';
const Code = require('code');
const Joi = require('joi');
const Hoek = require('hoek');
const Lab = require('lab');
const Helper = require('../test/helper.js');

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
                done();
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
                done();
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
                expect(response.result.paths['/test'].post.consumes).to.deep.equal(['application/x-www-form-urlencoded']);
                expect(response.result.paths['/test'].post.produces).to.deep.equal(['application/json', 'application/xml']);
                done();
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
                expect(response.result.paths['/test'].post.consumes).to.deep.equal(['application/x-www-form-urlencoded']);
                expect(response.result.paths['/test'].post.produces).to.deep.equal(['application/json', 'application/xml']);
                done();
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
                expect(response.result.paths['/test'].post.consumes).to.deep.equal(['application/x-www-form-urlencoded']);
                done();
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
                expect(response.result.paths['/test'].post.consumes).to.deep.equal(['multipart/form-data']);
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
                expect(response.result.paths['/test'].post.consumes).to.deep.equal(['multipart/form-data']);
                done();
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
                expect(response.result.paths['/test'].post.consumes).to.deep.equal(['application/x-www-form-urlencoded']);
                done();
            });
        });
    });


});
