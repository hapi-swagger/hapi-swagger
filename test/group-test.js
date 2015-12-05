'use strict';
var Code = require('code'),
    Lab = require('lab');

var Group = require('../lib/group.js'),
    Helper = require('../test/helper.js');

var expect = Code.expect,
    lab = exports.lab = Lab.script();



lab.experiment('group', function () {

    var routes = [{
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


    lab.test('test groups tagging of paths', function (done) {

        Helper.createServer({}, routes, function (err, server) {

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


    lab.test('getNameByPath 1', function (done) {

        var name = Group.getNameByPath({ pathPrefixSize: 1 }, '/lala/foo');
        expect(name).to.equal('lala');
        done();
    });


    lab.test('getNameByPath 2', function (done) {

        var name = Group.getNameByPath({ pathPrefixSize: 1 }, '/');
        expect(name).to.equal('');
        done();
    });


    lab.test('getNameByPath 3', function (done) {

        var name = Group.getNameByPath({ pathPrefixSize: 2 }, '/lala/foo');
        expect(name).to.equal('lala/foo');
        done();
    });


    lab.test('getNameByPath 4', function (done) {

        var name = Group.getNameByPath({ pathPrefixSize: 2 }, '/lala/foo/blah');
        expect(name).to.equal('lala/foo');
        done();
    });


    lab.test('getNameByPath 5', function (done) {

        var name = Group.getNameByPath({ pathPrefixSize: 2 }, '/lala');
        expect(name).to.equal('lala');
        done();
    });


});
