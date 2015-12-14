'use strict';
var Code = require('code'),
    Joi = require('joi'),
    Lab = require('lab');

var Helper = require('../test/helper.js');

var expect = Code.expect,
    lab = exports.lab = Lab.script();


lab.experiment('file', function () {

    var routes = {
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


    lab.test('upload', function (done) {

        Helper.createServer({}, routes, function (err, server) {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test/'].post.parameters).to.deep.equal([
                    {
                        'name': 'file',
                        'in': 'formData',
                        'required': true,
                        'type': 'file'
                    }
                ]);
                done();
            });
        });
    });



    lab.test('file type not fired on other meta properties', function (done) {

        routes.config.validate.payload.file = Joi.any().meta({ anything: 'test' }).required();

        Helper.createServer({}, routes, function (err, server) {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test/'].post.parameters).to.deep.equal([
                    {
                        'name': 'file',
                        'in': 'formData',
                        'required': true,
                        'type': 'string'
                    }
                ]);
                done();
            });
        });
    });

});
