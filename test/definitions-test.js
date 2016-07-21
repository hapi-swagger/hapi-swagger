'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../test/helper.js');

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
                    '$ref': '#/definitions/Model 1'
                });
                expect(response.result.definitions['Model 1']).to.equal(defination);
                done();
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

                done();
            });

        });
    });

});
