'use strict';
const Code = require('code');
const Lab = require('lab');
const Group = require('../lib/group.js');
const Helper = require('../test/helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();


lab.experiment('group', () => {

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
            tags: ['api']
        }
    }, {
        method: 'GET',
        path: '/movies/movie',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }, {
        method: 'GET',
        path: '/movies/movie/actor',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }];

    const routesWithVersionInPath = [{
        method: 'GET',
        path: '/v1/actors',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }, {
        method: 'GET',
        path: '/v1/movies',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }, {
        method: 'GET',
        path: '/v1/movies/movie',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }, {
        method: 'GET',
        path: '/v1/movies/movie/actor',
        handler: Helper.defaultHandler,
        config: {
            tags: ['api']
        }
    }];

    lab.test('test groups tagging of paths', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/actors'].get.tags[0]).to.equal('actors');
                expect(response.result.paths['/movies'].get.tags[0]).to.equal('movies');
                expect(response.result.paths['/movies/movie'].get.tags[0]).to.equal('movies');
                expect(response.result.paths['/movies/movie/actor'].get.tags[0]).to.equal('movies');
                done();
            });

        });
    });


    lab.test('test groups tagging of paths having basePath', (done) => {

        Helper.createServer({ basePath: '/api/' }, routes, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/actors'].get.tags[0]).to.equal('actors');
                expect(response.result.paths['/movies'].get.tags[0]).to.equal('movies');
                expect(response.result.paths['/movies/movie'].get.tags[0]).to.equal('movies');
                expect(response.result.paths['/movies/movie/actor'].get.tags[0]).to.equal('movies');
                done();
            });

        });
    });


    lab.test('test groups tagging of paths having suppressing version from base path', (done) => {

        Helper.createServer({ basePath: '/', suppressVersionFromBasePath: true, pathPrefixSize: 2 }, routesWithVersionInPath, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/actors'].get.tags[0]).to.equal('actors');
                expect(response.result.paths['/movies'].get.tags[0]).to.equal('movies');
                expect(response.result.paths['/movies/movie'].get.tags[0]).to.equal('movies');
                expect(response.result.paths['/movies/movie/actor'].get.tags[0]).to.equal('movies');
                done();
            });

        });
    });


    lab.test('getNameByPath 1', (done) => {

        const name = Group.getNameByPath(1, '/', '/lala/foo');
        expect(name).to.equal('lala');
        done();
    });


    lab.test('getNameByPath 2', (done) => {

        const name = Group.getNameByPath(1, '/', '/');
        expect(name).to.equal('');
        done();
    });


    lab.test('getNameByPath 3', (done) => {

        const name = Group.getNameByPath(2, '/', '/lala/foo');
        expect(name).to.equal('lala/foo');
        done();
    });


    lab.test('getNameByPath 4', (done) => {

        const name = Group.getNameByPath(2, '/', '/lala/foo/blah');
        expect(name).to.equal('lala/foo');
        done();
    });


    lab.test('getNameByPath 5', (done) => {

        const name = Group.getNameByPath(2, '/', '/lala');
        expect(name).to.equal('lala');
        done();
    });


    lab.test('getNameByPath with basePath = /v3/', (done) => {

        const name = Group.getNameByPath(2, '/v3/', '/v3/lala');
        expect(name).to.equal('lala');
        done();
    });


    lab.test('getNameByPath with basePath = /v3/', (done) => {

        const name = Group.getNameByPath(2, '/v3/', '/v3/lala/foo');
        expect(name).to.equal('lala');
        done();
    });


    lab.test('getNameByPath with basePath = /v3', (done) => {

        const name = Group.getNameByPath(2, '/v3', '/v3/lala/foo');
        expect(name).to.equal('lala');
        done();
    });


});
