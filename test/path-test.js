'use strict';
var Code = require('code'),
    Hoek = require('hoek'),
    Lab = require('lab');

var Helper = require('../test/helper.js');

var expect = Code.expect,
    lab = exports.lab = Lab.script();


lab.experiment('path', function () {

    var routes = {
        method: 'GET',
        path: '/test',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    };


    lab.test('notes', function (done) {

        var testRoutes = Hoek.clone(routes);
        testRoutes.config.notes = ['single item'];
        Helper.createServer({}, testRoutes, function (err, server) {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].get.description).to.equal('single item');
                done();
            });
        });
    });


    lab.test('notes as an array', function (done) {

        var testRoutes = Hoek.clone(routes);
        testRoutes.config.notes = ['note one', 'note two'];
        Helper.createServer({}, testRoutes, function (err, server) {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].get.description).to.equal('note one<br/><br/>note two');
                done();
            });
        });
    });


/*
    lab.test('notes as an array', function (done) {

        routes = {
            method: 'GET',
            path: '/test',
            handler: Helper.defaultHandler,
            config: {
                tags: ['api'],
                validate: {
                    payload: {
                        any: Joi.any(),
                        array: Joi.array(),
                        boolean: Joi.boolean(),
                        date: Joi.date(),
                        func: Joi.func(),
                        number: Joi.number(),
                        object: Joi.object(),
                        string: Joi.string(),
                        alternatives: Joi.alternatives().try(Joi.number(), Joi.string())
                    }
                },
            }
        };

        Helper.createServer({}, routes, function (err, server) {

            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test'].get.description).to.equal('note one<br/><br/>note two');
                done();
            });
        });
    });
    */

});
