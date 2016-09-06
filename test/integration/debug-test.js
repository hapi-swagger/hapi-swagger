'use strict';
const Joi = require('joi');
const Code = require('code');
const Lab = require('lab');
const Helper = require('../helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();


lab.experiment('debug', () => {

    const routesEmptyObjects = {
        method: 'POST',
        path: '/test',
        config: {
            handler: () => { },
            tags: ['api'],
            validate: {
                headers: Joi.object(),
                params: Joi.object(),
                query: Joi.object(),
                payload: Joi.object()
            }
        }
    };


    let logs = [];
    lab.before((done) => {
        Helper.createServer({ 'debug': true }, routesEmptyObjects, (err, server) => {
            server.on('log', (event) => {

                //console.log(event);
                if (event.tags.indexOf('error') > -1) {
                    logs.push(event);
                } else {
                    done();
                }
            });
            server.inject({ method: 'GET', url: '/swagger.json' }, function () {

            });
        });
    });


    lab.test('log - Joi.object() with child properties', (done) => {
        //console.log(logs);
        expect(logs[0].data).to.equal('The /test route params parameter was set, but not as a Joi.object() with child properties');
        expect(logs[1].data).to.equal('The /test route headers parameter was set, but not as a Joi.object() with child properties');
        expect(logs[2].data).to.equal('The /test route query parameter was set, but not as a Joi.object() with child properties');
        done();
    });

});



lab.experiment('debug', () => {

    const routesFuncObjects = {
        method: 'POST',
        path: '/test',
        config: {
            handler: () => { },
            tags: ['api'],
            validate: {
                payload: function (value, options, next) {

                    next(null, value);
                },
                params: function (value, options, next) {

                    next(null, value);
                },
                query: function (value, options, next) {

                    next(null, value);
                },
                headers: function (value, options, next) {

                    next(null, value);
                }
            }
        }
    };


    let logs = [];
    lab.before((done) => {
        Helper.createServer({ 'debug': true }, routesFuncObjects, (err, server) => {
            server.on('log', (event) => {

                //console.log(event);
                if (event.tags.indexOf('error') > -1 || event.tags.indexOf('warning') > -1) {
                    logs.push(event);
                } else {
                    done();
                }
            });
            server.inject({ method: 'GET', url: '/swagger.json' }, function () {

            });
        });
    });


    lab.test('log - Joi.function for a query, header or payload ', (done) => {
        //console.log(logs);
        expect(logs[0].data).to.equal('Using a Joi.function for a query, header or payload is not supported.');
        expect(logs[1].data).to.equal('Using a Joi.function for a params is not supported and has been removed.');
        expect(logs[2].data).to.equal('Using a Joi.function for a query, header or payload is not supported.');
        expect(logs[3].data).to.equal('Using a Joi.function for a query, header or payload is not supported.');
        done();
    });

});



lab.experiment('debug', () => {

    const routesFuncObjects = {
        method: 'POST',
        path: '/test/{a}/{b?}',
        config: {
            handler: (request, reply) => { reply('ok'); },
            tags: ['api'],
            validate: {
                params: Joi.object({
                    a: Joi.string(),
                    b: Joi.string()
                })

            }
        }
    };


    let logs = [];
    lab.before((done) => {
        Helper.createServer({ 'debug': true }, routesFuncObjects, (err, server) => {
            server.on('log', (event) => {

                //console.log(event);
                if (event.tags.indexOf('warning') > -1) {
                    logs.push(event);
                } else {
                    done();
                }
            });
            server.inject({ method: 'GET', url: '/swagger.json' }, function () {

            });
        });
    });


    lab.test('log - optional parameters breaking validation of JSON', (done) => {
        //console.log(logs);
        expect(logs[0].data).to.equal('The /test/{a}/{b?} params parameter {b} is set as optional. This will work in the UI, but is invalid in the swagger spec');
        done();
    });

});
