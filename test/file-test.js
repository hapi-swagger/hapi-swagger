'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('file', () => {

    let routes = {
        method: 'POST',
        path: '/test/',
        config: {
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                }
            },
            tags: ['api'],
            validate: {
                payload: {
                    file: Joi.any()
                        .meta({ swaggerType: 'file' })
                        .required()
                }
            },
            payload: {
                maxBytes: 1048576,
                parse: true,
                output: 'stream'
            }
        }
    };


    lab.test('upload', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result.paths['/test/'].post.parameters));
                expect(err).to.equal(null);
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test/'].post.parameters).to.equal([
                    {
                        'type': 'file',
                        'required': true,
                        'x-meta': {
                            'swaggerType': 'file'
                        },
                        'name': 'file',
                        'in': 'formData'
                    }
                ]);
                done();
            });
        });
    });

    lab.test('upload with binary file type', (done) => {
        routes.config.validate.payload.file = Joi.binary().meta({ swaggerType: 'file' }).required();

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result.paths['/test/'].post.parameters));
                expect(err).to.equal(null);
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test/'].post.parameters).to.equal([
                    {
                        'type': 'file',
                        'format': 'binary',
                        'required': true,
                        'x-meta': {
                            'swaggerType': 'file'
                        },
                        'name': 'file',
                        'in': 'formData'
                    }
                ]);
                done();
            });
        });
    });



    lab.test('file type not fired on other meta properties', (done) => {

        routes.config.validate.payload.file = Joi.any().meta({ anything: 'test' }).required();

        Helper.createServer({}, routes, (err, server) => {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result.paths['/test/']));
                expect(err).to.equal(null);
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test/'].post.parameters).to.equal([
                    {
                        'required': true,
                        'x-meta': {
                            'anything': 'test'
                        },
                        'in': 'formData',
                        'name': 'file',
                        'type': 'string'
                    }
                ]);
                done();
            });
        });
    });

});
