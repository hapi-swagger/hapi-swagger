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

                // console.log(JSON.stringify(response.result.paths['/test/'].post.parameters[0].schem));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test/'].post.parameters[0].schema).to.deep.equal({
                    '$ref': '#/definitions/parameters_test_post'
                });
                expect(response.result.definitions.parameters_test_post).to.deep.equal(defination);
                done();
            });

        });
    });

});
