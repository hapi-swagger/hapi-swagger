'use strict';
var Code = require('code'),
    Joi = require('joi'),
    Lab = require('lab');

var Helper = require('../test/helper.js');

var expect = Code.expect,
    lab = exports.lab = Lab.script();


lab.experiment('authentication', function () {

    // route using bearer token auth
    var routes = {
        method: 'POST',
        path: '/bookmarks/',
        config: {
            handler: Helper.defaultAuthHandler,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                }
            },
            tags: ['api'],
            auth: {
                strategies: ['bearer']
            },
            validate: {
                headers: Joi.object({
                    authorization: Joi.string()
                        .default('Bearer 12345')
                        .description('bearer token')
                }).unknown(),

                payload: {
                    url: Joi.string()
                        .required()
                        .description('the url to bookmark')
                }
            }
        }
    };


    lab.test('get plug-in interface with bearer token', function (done) {

        var requestOptions = {
            method: 'GET',
            url: '/swagger.json',
            headers: {
                authorization: 'Bearer 12345'
            }
        };

        Helper.createAuthServer({}, routes, function (err, server) {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });


    lab.test('get plug-in interface without bearer token', function (done) {

        var requestOptions = {
            method: 'GET',
            url: '/swagger.json'
        };

        // plugin routes should be not be affected by auth on API
        Helper.createAuthServer({}, routes, function (err, server) {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });


    lab.test('get API interface with bearer token', function (done) {

        var requestOptions = {
            method: 'POST',
            url: '/bookmarks/',
            headers: {
                authorization: 'Bearer 12345'
            },
            payload: {
                url: 'http://glennjones.net'
            }
        };

        Helper.createAuthServer({}, routes, function (err, server) {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });


    lab.test('get API interface with incorrect bearer token', function (done) {

        var requestOptions = {
            method: 'POST',
            url: '/bookmarks/',
            headers: {
                authorization: 'Bearer XXXXXX'
            },
            payload: {
                url: 'http://glennjones.net'
            }
        };

        Helper.createAuthServer({}, routes, function (err, server) {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(401);
                done();
            });
        });
    });


});




