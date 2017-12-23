const Code = require('code');
const Lab = require('lab');
const Group = require('../../lib/group.js');
const Helper = require('../helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();

lab.experiment('group', () => {

    const routes = [{
        method: 'GET',
        path: '/actors',
        options: {
            tags: ['api'],
            handler: Helper.defaultHandler
        }
    }, {
        method: 'GET',
        path: '/movies',
        options: {
            tags: ['api'],
            handler: Helper.defaultHandler
        }
    }, {
        method: 'GET',
        path: '/movies/movie',
        options: {
            tags: ['api'],
            handler: Helper.defaultHandler
        }
    }, {
        method: 'GET',
        path: '/movies/movie/actor',
        options: {
            tags: ['api'],
            handler: Helper.defaultHandler
        }
    }];


    lab.test('test groups tagging of paths', async() => {

        const server = await Helper.createServer({}, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/actors'].get.tags[0]).to.equal('actors');
        expect(response.result.paths['/movies'].get.tags[0]).to.equal('movies');
        expect(response.result.paths['/movies/movie'].get.tags[0]).to.equal('movies');
        expect(response.result.paths['/movies/movie/actor'].get.tags[0]).to.equal('movies');
    });


    lab.test('getNameByPath 1', () => {

        const name = Group.getNameByPath(1, '/', '/lala/foo');
        expect(name).to.equal('lala');
    });


    lab.test('getNameByPath 2', () => {

        const name = Group.getNameByPath(1, '/', '/');
        expect(name).to.equal('');
    });


    lab.test('getNameByPath 3', () => {

        const name = Group.getNameByPath(2, '/', '/lala/foo');
        expect(name).to.equal('lala/foo');
    });


    lab.test('getNameByPath 4', () => {

        const name = Group.getNameByPath(2, '/', '/lala/foo/blah');
        expect(name).to.equal('lala/foo');
    });


    lab.test('getNameByPath 5', () => {

        const name = Group.getNameByPath(2, '/', '/lala');
        expect(name).to.equal('lala');
    });


    lab.test('getNameByPath with basePath = /v3/', () => {

        const name = Group.getNameByPath(2, '/v3/', '/v3/lala');
        expect(name).to.equal('lala');
    });


    lab.test('getNameByPath with basePath = /v3/', () => {

        const name = Group.getNameByPath(2, '/v3/', '/v3/lala/foo');
        expect(name).to.equal('lala');
    });


    lab.test('getNameByPath with basePath = /v3', () => {

        const name = Group.getNameByPath(2, '/v3', '/v3/lala/foo');
        expect(name).to.equal('lala');
    });


});
