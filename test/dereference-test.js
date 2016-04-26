'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Builder = require('../lib/builder.js');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('dereference', () => {

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


    lab.test('flatten with no references', (done) => {

        Helper.createServer({ derefJSONSchema: true }, routes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/store/'].post.parameters).to.deep.equal([
                    {
                        'in': 'body',
                        'name': 'body',
                        'schema': {
                            'properties': {
                                'a': {
                                    'type': 'number'
                                },
                                'b': {
                                    'type': 'number'
                                },
                                'operator': {
                                    'type': 'string'
                                },
                                'equals': {
                                    'type': 'number'
                                }
                            },
                            'type': 'object'
                        }
                    }
                ]);
                done();
            });
        });
    });


    lab.test('dereferences error', (done) => {

        Builder.dereference(null, function (err, json) {

            //console.log(JSON.stringify(json));
            expect(err).to.exists();
            expect(err).to.deep.equal({ 'error': 'fail to dereference schema' });
            expect(json).to.not.exists();
            done();
        });

    });

});
