'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();


lab.experiment('default `auth` settings', () => {
    const routes = [
        {
            method: 'GET',
            path: '/',
            config: {
                auth: false,
                handler: function (request, reply) {

                    reply({ text: 'Token not required' });
                }
            }
        }, {
            method: 'GET',
            path: '/restricted',
            config: {
                auth: 'jwt',
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        security: [{ 'jwt': [] }]
                    }
                },
                handler: function (request, reply) {

                    reply({ text: 'You used a Token! ' + request.auth.credentials.name })
                        .header('Authorization', request.headers.authorization);
                }
            }
        }
    ];


    lab.test('get documentation page should not be restricted', (done) => {

        const requestOptions = {
            method: 'GET',
            url: '/documentation'
        };

        Helper.createJWTAuthServer({}, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });


    lab.test('get documentation page should be restricted 401', (done) => {

        const requestOptions = {
            method: 'GET',
            url: '/documentation'
        };

        Helper.createJWTAuthServer({ auth: undefined }, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(401);
                done();
            });
        });
    });


});



lab.experiment('authentication', () => {

    // route using bearer token auth
    const routes = {
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


    lab.test('get plug-in interface with bearer token', (done) => {

        const requestOptions = {
            method: 'GET',
            url: '/swagger.json',
            headers: {
                authorization: 'Bearer 12345'
            }
        };

        Helper.createAuthServer({}, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('get plug-in interface without bearer token', (done) => {

        const requestOptions = {
            method: 'GET',
            url: '/swagger.json'
        };

        // plugin routes should be not be affected by auth on API
        Helper.createAuthServer({}, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('get API interface with bearer token', (done) => {

        const requestOptions = {
            method: 'POST',
            url: '/bookmarks/',
            headers: {
                authorization: 'Bearer 12345'
            },
            payload: {
                url: 'http://glennjones.net'
            }
        };

        Helper.createAuthServer({}, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });


    lab.test('get API interface with incorrect bearer token', (done) => {

        const requestOptions = {
            method: 'POST',
            url: '/bookmarks/',
            headers: {
                authorization: 'Bearer XXXXXX'
            },
            payload: {
                url: 'http://glennjones.net'
            }
        };

        Helper.createAuthServer({}, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(401);
                done();
            });
        });
    });


});




