'use strict';
const Code = require('code');
const Lab = require('lab');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('wildcard routes', () => {

    lab.test('method *', (done) => {

        const routes = {
            method: '*',
            path: '/test',
            handler: Helper.defaultHandler,
            config: {
                tags: ['api'],
                notes: 'test'
            }
        };

        Helper.createServer({}, routes, (err, server) => {

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


    lab.test('method array [GET, POST]', (done) => {

        const routes = {
            method: ['GET', 'POST'],
            path: '/test',
            handler: Helper.defaultHandler,
            config: {
                tags: ['api'],
                notes: 'test'
            }
        };

        Helper.createServer({}, routes, (err, server) => {

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
