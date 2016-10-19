'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('definitions', () => {

    const routes = [{
        method: 'POST',
        path: '/test/',
        config: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: {
                    a: Joi.number()
                        .required()
                        .description('the first number'),

                    b: Joi.number()
                        .required()
                        .description('the second number'),

                    operator: Joi.string()
                        .required()
                        .default('+')
                        .description('the opertator i.e. + - / or *'),

                    equals: Joi.number()
                        .required()
                        .description('the result of the sum')
                }
            }
        }
    },{
        method: 'POST',
        path: '/test/2',
        config: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    a: Joi.string(),
                    b: Joi.object({
                        c: Joi.string()
                    })
                }).label('Model')
            }
        }
    },{
        method: 'POST',
        path: '/test/3',
        config: {
            handler: Helper.defaultHandler,
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    a: Joi.string(),
                    b: Joi.object({
                        c: Joi.string()
                    })
                }).label('Model 1')
            }
        }
    }];


    lab.test('payload with inline definition', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            const defination = {
                'properties': {
                    'a': {
                        'description': 'the first number',
                        'type': 'number'
                    },
                    'b': {
                        'description': 'the second number',
                        'type': 'number'
                    },
                    'operator': {
                        'description': 'the opertator i.e. + - / or *',
                        'default': '+',
                        'type': 'string'
                    },
                    'equals': {
                        'description': 'the result of the sum',
                        'type': 'number'
                    }
                },
                'required': [
                    'a',
                    'b',
                    'operator',
                    'equals'
                ],
                'type': 'object'
            };

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test/'].post.parameters[0].schema).to.equal({
                    '$ref': '#/definitions/Model 1',
                    'type': 'object'
                });
                expect(response.result.definitions['Model 1']).to.equal(defination);
                Helper.validate(response, done, expect);
            });

        });
    });


    lab.test('override definition named Model', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result.definitions));
                expect(response.result.definitions.b).to.exists();
                expect(response.result.definitions.Model).to.exists();
                expect(response.result.definitions['Model 1']).to.exists();

                Helper.validate(response, done, expect);
            });

        });
    });

    lab.test('reuseDefinitions = false', (done) => {

        // forces two models even though the model hash is the same

        const tempRoutes = [{
            method: 'POST',
            path: '/store1/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: Joi.object({
                        a: Joi.number(),
                        b: Joi.number(),
                        operator: Joi.string(),
                        equals: Joi.number()
                    }).label('A')
                }
            }
        }, {
            method: 'POST',
            path: '/store2/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: Joi.object({
                        a: Joi.number(),
                        b: Joi.number(),
                        operator: Joi.string(),
                        equals: Joi.number()
                    }).label('B')
                }
            }
        }];

        Helper.createServer({ reuseDefinitions: false }, tempRoutes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.definitions.A).to.exist();
                expect(response.result.definitions.B).to.exist();
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('test that optional array is not in swagger output', (done) => {

        let testRoutes = [{
            method: 'POST',
            path: '/server/1/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: Joi.object({
                        a: Joi.number().required(),
                        b: Joi.string().optional()
                    }).label('test')
                }
            }
        }];

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                expect(response.statusCode).to.equal(200);
                expect(response.result.definitions.test).to.equal({
                    'type': 'object',
                    'properties': {
                        'a': {
                            'type': 'number'
                        },
                        'b': {
                            'type': 'string'
                        }
                    },
                    'required': [
                        'a'
                    ]
                });
                done();
            });
        });
    });


    lab.test('test that name changing for required', (done) => {


        const FormDependencyDefinition = Joi.object({
            id: Joi.number().required()
        }).label('FormDependencyDefinition');

        const ActionDefinition = Joi.object({
            id: Joi.number().required().allow(null),
            reminder: FormDependencyDefinition.required()
        }).label('ActionDefinition');


        let testRoutes = [{
            method: 'POST',
            path: '/server/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: ActionDefinition
                }
            }
        }];

        Helper.createServer({}, testRoutes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                expect(response.statusCode).to.equal(200);
                expect(response.result.definitions.ActionDefinition).to.equal({
                    'type': 'object',
                    'properties': {
                        'id': {
                            'type': 'number'
                        },
                        'reminder': {
                            '$ref': '#/definitions/FormDependencyDefinition',
                            'type': 'object'
                        }
                    },
                    'required': [
                        'id',
                        'reminder'
                    ]
                });
                done();
            });
        });
    });



});
