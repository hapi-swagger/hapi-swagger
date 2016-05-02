'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');

const Helper = require('../test/helper.js');

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
                    done();
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
                done();
            });
        });
    });


});
