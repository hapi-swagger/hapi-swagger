'use strict';
const Code = require('code');
const Lab = require('lab');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('filter', () => {

    const routes = [{
        method: 'GET',
        path: '/actors',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }, {
        method: 'GET',
        path: '/movies',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api', 'a']
        }
    }, {
        method: 'GET',
        path: '/movies/movie',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api', 'b', 'a']
        }
    }, {
        method: 'GET',
        path: '/movies/movie/actor',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api', 'c']
        }
    }, {
        method: 'GET',
        path: '/movies/movie/actors',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api', 'd']
        }
    }];


    lab.test('filter by tags=a', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json?tags=a' }, function (response) {

                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths).to.have.length(2);
                done();
            });

        });
    });


    lab.test('filter by tags=a', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json?tags=a,b,c,d' }, function (response) {

                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths).to.have.length(4);
                done();
            });

        });
    });


    lab.test('filter by tags=a,c', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json?tags=a,c' }, function (response) {

                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths).to.have.length(3);
                done();
            });

        });
    });


    lab.test('filter by tags=a,-b', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json?tags=a,-b' }, function (response) {

                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths).to.have.length(1);
                done();
            });

        });
    });


    lab.test('filter by tags=a,+c', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            // note %2B is a '+' plus char url encoded
            server.inject({ method: 'GET', url: '/swagger.json?tags=a,%2Bb' }, function (response) {

                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths).to.have.length(0);
                done();
            });

        });
    });


    lab.test('filter by tags=x', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            // note %2B is a '+' plus char url encoded
            server.inject({ method: 'GET', url: '/swagger.json?tags=x' }, function (response) {

                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths).to.have.length(0);
                done();
            });

        });
    });


});
