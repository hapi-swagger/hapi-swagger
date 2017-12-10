const Code = require('code');
const Lab = require('lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('sort', () => {

    const routes = [{
        method: 'POST',
        path: '/x',
        config: {
            tags: ['api'],
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    order: 7
                }
            }
        }
    }, {
        method: 'GET',
        path: '/b',
        config: {
            tags: ['api'],
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    order: 5
                }
            }
        }
    }, {
        method: 'GET',
        path: '/b/c',
        config: {
            tags: ['api'],
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    order: 4
                }
            }
        }
    }, {
        method: 'POST',
        path: '/b/c/d',
        config: {
            tags: ['api'],
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    order: 1
                }
            }
        }
    }, {
        method: 'GET',
        path: '/b/c/d',
        config: {
            tags: ['api'],
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    order: 2
                }
            }
        }
    },{
        method: 'DELETE',
        path: '/a',
        config: {
            tags: ['api'],
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    order: 3
                }
            }
        }
    },{
        method: 'POST',
        path: '/a',
        config: {
            tags: ['api'],
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    order: 7
                }
            }
        }
    },{
        method: 'GET',
        path: '/a',
        config: {
            tags: ['api'],
            handler: Helper.defaultHandler,
            plugins: {
                'hapi-swagger': {
                    order: 6
                }
            }
        }
    }];

    /* These test are no longer needed `sortPaths` is to be deprecate

    lab.test('sort ordered unsorted', (done) => {

        Helper.createServer({ sortPaths: 'unsorted' }, routes, (err, server) => {
            server.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

                //console.log(JSON.stringify(response.result.paths['/a']));
                expect(Object.keys(response.result.paths['/a'])).to.equal(['post', 'get', 'delete']);
                done();
            });
        });
    });
     */


    lab.test('sort ordered path-method', async() => {

        const server = await Helper.createServer({ sortPaths: 'path-method' }, routes);
        const response = await server.inject({ method: 'GET', url: '/swagger.json' });
        expect(Object.keys(response.result.paths['/a'])).to.equal(['delete', 'get', 'post']);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
    });



});
