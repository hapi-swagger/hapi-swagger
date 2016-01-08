'use strict';
const Code = require('code');
const Lab = require('lab');
const Hoek = require('hoek');
const Sort = require('../lib/sort.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('sort', () => {

    const routes = [{
        method: 'POST',
        path: '/a',
        config: {
            tags: ['api']
        }
    },{
        method: 'GET',
        path: '/a',
        config: {
            tags: ['api']
        }
    }, {
        method: 'GET',
        path: '/b',
        config: {
            tags: ['api']
        }
    }, {
        method: 'GET',
        path: '/b/c',
        config: {
            tags: ['api']
        }
    }, {
        method: 'GET',
        path: '/b/a/b',
        config: {
            tags: ['api']
        }
    }, {
        method: 'GET',
        path: '/b/a/b',
        config: {
            tags: ['api']
        }
    },{
        method: 'DELETE',
        path: '/a',
        config: {
            tags: ['api']
        }
    }];


    lab.test('sort unsort default', (done) => {

        let testRoutes = Hoek.clone(routes);
        Sort.paths('unsorted', testRoutes);

        //console.log(JSON.stringify(testRoutes));
        expect(testRoutes[0]).to.deep.equal({
            'method':'POST',
            'path':'/a',
            'config':{
                'tags':['api']
            }
        });
        expect(testRoutes[6]).to.deep.equal({
            'method':'DELETE',
            'path':'/a',
            'config':{
                'tags':['api']
            }
        });
        done();
    });



    lab.test('sort path-method', (done) => {

        let testRoutes = Hoek.clone(routes);
        Sort.paths('path-method', testRoutes);

        //console.log(JSON.stringify(testRoutes));
        expect(testRoutes[4]).to.deep.equal({
            'method':'GET',
            'path':'/b/a/b',
            'config':{
                'tags':['api']
            }
        });
        expect(testRoutes[0]).to.deep.equal({
            'method':'DELETE',
            'path':'/a',
            'config':{
                'tags':['api']
            }
        });
        done();
    });



});
