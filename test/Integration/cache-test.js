'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');

const Helper = require('../helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('plugin', () => {

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



    lab.test('basic cache', (done) => {

        let swaggerOptions = {
            'cache': {
                'expiresIn': 24 * 60 * 60 * 1000
            }
        };

        Helper.createServer(swaggerOptions, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function () {

                // double call to test code paths as cache works
                server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {
                    //console.log(JSON.stringify(response.result));
                    expect(response.statusCode).to.equal(200);
                    Helper.validate(response, done, expect);
                });
            });
        });
    });


    lab.test('cache with generateTimeout', (done) => {

        let swaggerOptions = {
            'cache': {
                'expiresIn': 24 * 60 * 60 * 1000,
                'generateTimeout': 30 * 1000
            }
        };

        Helper.createServer(swaggerOptions, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                Helper.validate(response, done, expect);
            });
        });
    });


    lab.test('model cache using weakmap', (done) => {

        // test if a joi object weakmap cache
        // the Joi object should only be parsed once

        let joiObj = Joi.object({
            a: Joi.number(),
            b: Joi.number(),
            operator: Joi.string(),
            equals: Joi.number()
        });

        const tempRoutes = [{
            method: 'POST',
            path: '/store1/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: joiObj
                }
            }
        },{
            method: 'POST',
            path: '/store2/',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
                validate: {
                    payload: joiObj
                }
            }
        }];

        Helper.createServer({}, tempRoutes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                Helper.validate(response, done, expect);
            });
        });
    });


});
