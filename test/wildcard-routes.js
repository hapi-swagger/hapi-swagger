'use strict';
var Code = require('code'),
    Lab = require('lab');

var Helper = require('../test/helper.js');

var expect = Code.expect,
    lab = exports.lab = Lab.script();


lab.experiment('wildcard routes', function () {

    lab.test('method *', function (done) {

        var routes = {
            method: '*',
            path: '/test',
            handler: Helper.defaultHandler,
            config: {
                tags: ['api'],
                notes: 'test'
            }
        };

        Helper.createServer({}, routes, function (err, server) {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test']).to.have.length(5);
                expect(response.result.paths['/test']).to.include('get');
                expect(response.result.paths['/test']).to.include('post');
                expect(response.result.paths['/test']).to.include('put');
                expect(response.result.paths['/test']).to.include('patch');
                expect(response.result.paths['/test']).to.include('delete');
                done();
            });
        });
    });


    lab.test('method array [GET, POST]', function (done) {

        var routes = {
            method: ['GET', 'POST'],
            path: '/test',
            handler: Helper.defaultHandler,
            config: {
                tags: ['api'],
                notes: 'test'
            }
        };

        Helper.createServer({}, routes, function (err, server) {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/test']).to.have.length(2);
                expect(response.result.paths['/test']).to.include('get');
                expect(response.result.paths['/test']).to.include('post');
                done();
            });
        });
    });

});
