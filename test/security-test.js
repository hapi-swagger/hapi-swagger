'use strict';
var Code = require('code'),
    Joi = require('joi'),
    Lab = require('lab');

var Helper = require('../test/helper.js');

var expect = Code.expect,
    lab = exports.lab = Lab.script();


lab.experiment('security', function () {


    // example from http://petstore.swagger.io/v2/swagger.json
    var swaggerOptions = {
        'securityDefinitions': {
            'petstore_auth': {
                'type': 'oauth2',
                'authorizationUrl': 'http://petstore.swagger.io/api/oauth/dialog',
                'flow': 'implicit',
                'scopes': {
                    'write:pets': 'modify pets in your account',
                    'read:pets': 'read your pets'
                }
            },
            'api_key': {
                'type': 'apiKey',
                'name': 'api_key',
                'in': 'header'
            }
        },
        'security': [{ 'api_key': [] }]
    };

    // route with examples of security objects from http://petstore.swagger.io/v2/swagger.json
    var routes = [{
        method: 'POST',
        path: '/bookmarks/1/',
        config: {
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    'payloadType': 'form',
                    'security': [{ 'api_key': [] }]
                }
            },
            tags: ['api'],
            validate: {
                payload: {
                    url: Joi.string()
                        .required()
                        .description('the url to bookmark')
                }
            }
        }
    }, {
        method: 'POST',
        path: '/bookmarks/2/',
        config: {
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    'payloadType': 'form',
                    'security': [
                        {
                            'petstore_auth': [
                                'write:pets',
                                'read:pets'
                            ]
                        }
                    ]
                }
            },
            tags: ['api'],
            validate: {
                payload: {
                    url: Joi.string()
                        .required()
                        .description('the url to bookmark')
                }
            }
        }
    }];



    lab.test('passes through securityDefinitions', function (done) {

        var requestOptions = {
            method: 'GET',
            url: '/swagger.json',
            headers: {
                authorization: 'Bearer 12345'
            }
        };

        Helper.createServer(swaggerOptions, routes, function (err, server) {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.result.securityDefinitions).to.deep.equal(swaggerOptions.securityDefinitions);
                done();
            });
        });
    });


    lab.test('passes through security objects for whole api', function (done) {

        var requestOptions = {
            method: 'GET',
            url: '/swagger.json'
        };

        // plugin routes should be not be affected by auth on API
        Helper.createServer(swaggerOptions, routes, function (err, server) {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.result.security).to.deep.equal(swaggerOptions.security);
                done();
            });
        });
    });


    lab.test('passes through security objects on routes', function (done) {

        var requestOptions = {
            method: 'GET',
            url: '/swagger.json'
        };

        // plugin routes should be not be affected by auth on API
        Helper.createServer(swaggerOptions, routes, function (err, server) {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.result.paths['/bookmarks/1/'].post.security).to.deep.equal([
                    {
                        'api_key': []
                    }
                ]);
                expect(response.result.paths['/bookmarks/2/'].post.security).to.deep.equal([
                    {
                        'petstore_auth': [
                            'write:pets',
                            'read:pets'
                        ]
                    }
                ]);
                done();
            });
        });
    });

});
