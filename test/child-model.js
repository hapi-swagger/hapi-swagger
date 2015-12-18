'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('child-models', () => {

    const requestOptions = {
        method: 'GET',
        url: '/swagger.json',
        headers: {
            host: 'localhost'
        }
    };

    const routes = {
        method: 'POST',
        path: '/foo/v1/bar',
        config: {
            description: '...',
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    outer1: Joi.object({
                        inner1: Joi.string()
                    }),
                    outer2: Joi.object({
                        inner2: Joi.string()
                    })
                })
            },
            handler: function () { }
        }
    };



    lab.test('child', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/foo/v1/bar'].post.parameters[0].schema).to.deep.equal({
                    '$ref': '#/definitions/foov1bar_payload'
                });
                expect(response.result.definitions.foov1bar_payload).to.deep.equal({
                    'properties': {
                        'outer1': {
                            'properties': {
                                'inner1': {
                                    'type': 'string'
                                }
                            }
                        },
                        'outer2': {
                            'properties': {
                                'inner2': {
                                    'type': 'string'
                                }
                            }
                        }
                    },
                    'type': 'object'
                });
                done();
            });
        });
    });



});


