'use strict';
var Code = require('code'),
    Lab = require('lab');

var Helper = require('../test/helper.js');

var expect = Code.expect,
    lab = exports.lab = Lab.script();


lab.experiment('tags', function () {

    var routes = [{
        method: 'GET',
        path: '/test',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }];


    lab.test('no tag objects passed', function (done) {

        Helper.createServer({}, routes, function (err, server) {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.tags).to.deep.equal([]);
                done();
            });
        });
    });


    lab.test('name property passed', function (done) {

        var swaggerOptions = {
            tags: [{
                'name': 'test'
            }]
        };

        Helper.createServer(swaggerOptions, routes, function (err, server) {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.tags[0].name).to.equal('test');
                done();
            });
        });
    });


    lab.test('full tag object', function (done) {

        var swaggerOptions = {
            tags: [{
                'name': 'test',
                'description': 'Everything about test',
                'externalDocs': {
                    'description': 'Find out more',
                    'url': 'http://swagger.io'
                }
            }]
        };

        Helper.createServer(swaggerOptions, routes, function (err, server) {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.tags).to.deep.equal(swaggerOptions.tags);
                done();
            });
        });
    });

});
