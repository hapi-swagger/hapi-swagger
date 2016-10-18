'use strict';
const Joi = require('joi');
const Code = require('code');
const Lab = require('lab');
const Helper = require('../helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



const routes = [{
    method: 'GET',
    path: '/test',
    handler: Helper.defaultHandler,
    config: {
        tags: ['api']
    }
}];

const xPropertiesRoutes = [{
    method: 'POST',
    path: '/test',
    handler: Helper.defaultHandler,
    config: {
        tags: ['api'],
        validate: {
            payload: {
                'number': Joi.number().greater(10),
                'string': Joi.string().alphanum(),
                'array': Joi.array().items(Joi.string()).length(2)
            }
        }
    }
}];


const reuseModelsRoutes = [{
    method: 'POST',
    path: '/test',
    handler: Helper.defaultHandler,
    config: {
        tags: ['api'],
        validate: {
            payload: {
                'a': Joi.object({ 'a': Joi.string() }),
                'b': Joi.object({ 'a': Joi.string() })
            }
        }
    }
}];



lab.experiment('builder', () => {


    lab.test('defaults for swagger root object properties', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.swagger).to.equal('2.0');
                expect(response.result.schemes).to.equal(['http']);
                expect(response.result.basePath).to.equal('/');
                expect(response.result.consumes).to.not.exist();
                expect(response.result.produces).to.not.exist();
                Helper.validate(response, done, expect);
            });

        });
    });


    lab.test('set values for swagger root object properties', (done) => {

        const swaggerOptions = {
            'swagger': '5.9.45',
            'schemes': ['https'],
            'basePath': '/base',
            'consumes': ['application/x-www-form-urlencoded'],
            'produces': ['application/json', 'application/xml'],
            'externalDocs': {
                'description': 'Find out more about HAPI',
                'url': 'http://hapijs.com'
            }
        };

        Helper.createServer(swaggerOptions, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                //console.log(JSON.stringify(response.result))
                expect(response.result.swagger).to.equal('2.0');
                expect(response.result.schemes).to.equal(['https']);
                expect(response.result.basePath).to.equal('/base');
                expect(response.result.consumes).to.equal(['application/x-www-form-urlencoded']);
                expect(response.result.produces).to.equal(['application/json', 'application/xml']);
                expect(response.result.externalDocs).to.equal(swaggerOptions.externalDocs);
                Helper.validate(response, done, expect);
            });

        });
    });




    lab.test('xProperties : false', (done) => {

        Helper.createServer({ 'xProperties': false }, xPropertiesRoutes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result));
                expect(response.result.definitions).to.equal({
                    'array': {
                        'type': 'array',
                        'items': {
                            'type': 'string'
                        }
                    },
                    'Model 1': {
                        'type': 'object',
                        'properties': {
                            'number': {
                                'type': 'number'
                            },
                            'string': {
                                'type': 'string'
                            },
                            'array': {
                                '$ref': '#/definitions/array',
                                'type': 'array'
                            }
                        }
                    }
                });

                Helper.validate(response, done, expect);
            });

        });
    });


    lab.test('xProperties : false', (done) => {

        Helper.createServer({ 'xProperties': true }, xPropertiesRoutes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result));
                expect(response.result.definitions).to.equal({
                    'array': {
                        'type': 'array',
                        'x-constraint': {
                            'length': 2
                        },
                        'items': {
                            'type': 'string'
                        }
                    },
                    'Model 1': {
                        'type': 'object',
                        'properties': {
                            'number': {
                                'type': 'number',
                                'x-constraint': {
                                    'greater': 10
                                }
                            },
                            'string': {
                                'type': 'string',
                                'x-format': {
                                    'alphanum': true
                                }
                            },
                            'array': {
                                '$ref': '#/definitions/array',
                                'type': 'array'
                            }
                        }
                    }
                });

                Helper.validate(response, done, expect);
            });

        });
    });


    lab.test('reuseDefinitions : true', (done) => {

        Helper.createServer({ 'reuseDefinitions': true }, reuseModelsRoutes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result));
                expect(response.result.definitions).to.equal({
                    'a': {
                        'type': 'object',
                        'properties': {
                            'a': {
                                'type': 'string'
                            }
                        }
                    },
                    'Model 1': {
                        'type': 'object',
                        'properties': {
                            'a': {
                                '$ref': '#/definitions/a',
                                'type': 'object'
                            },
                            'b': {
                                '$ref': '#/definitions/a',
                                'type': 'object'
                            }
                        }
                    }
                });

                Helper.validate(response, done, expect);
            });

        });
    });


    lab.test('reuseDefinitions : false', (done) => {

        Helper.createServer({ 'reuseDefinitions': false }, reuseModelsRoutes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result));
                expect(response.result.definitions).to.equal({
                    'a': {
                        'type': 'object',
                        'properties': {
                            'a': {
                                'type': 'string'
                            }
                        }
                    },
                    'b': {
                        'type': 'object',
                        'properties': {
                            'a': {
                                'type': 'string'
                            }
                        }
                    },
                    'Model 1': {
                        'type': 'object',
                        'properties': {
                            'a': {
                                '$ref': '#/definitions/a',
                                'type': 'object'
                            },
                            'b': {
                                '$ref': '#/definitions/b',
                                'type': 'object'
                            }
                        }
                    }
                });

                Helper.validate(response, done, expect);
            });

        });
    });

});


lab.experiment('builder', () => {

    let logs = [];
    lab.before((done) => {
        Helper.createServer({ 'debug': true }, reuseModelsRoutes, (err, server) => {
            server.on('log', (event) => {

                logs = event.tags;
                //console.log(event);
                if (event.data === 'PASSED - The swagger.json validation passed.') {
                    logs = event.tags;
                    done();
                }
            });
            server.inject({ method: 'GET', url: '/swagger.json' }, function () {

            });
        });
    });



    lab.test('debug : true', (done) => {
        //console.log(logs);
        expect(logs).to.equal(['hapi-swagger', 'validation', 'info']);
        done();
    });

});


