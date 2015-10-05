/*
Mocha test
Tests multiple server connections
*/

var Chai = require('chai'),
    Hapi = require('hapi'),
    Joi = require('joi'),
    Inert = require('inert'),
    Vision = require('vision'),
    Hoek = require('hoek'),
    HapiSwagger = require('../lib/index.js'),
    assert = Chai.assert;


var server


var plugin1 = function (server, options, next) {
    server.route({
        method: 'GET',
        path: '/plugin1',
        config: {
            handler: function (request, reply) {
                reply('Hi from plugin 1');
            },
            description: 'plugin1',
            tags: ['api']
        }
    });
    next();
};
plugin1.attributes = { name: 'plugin1' };



var plugin2 = function (server, options, next) {
    server.route({
        method: 'GET',
        path: '/plugin2',
        config: {
            handler: function (request, reply) {
                reply('Hi from plugin 2');
            },
            description: 'plugin2',
            tags: ['api']
        }
    });
    next();
};
plugin2.attributes = { name: 'plugin2' };




describe('multiples', function () {

    beforeEach(function (done) {
        server = new Hapi.Server();
        server.connection({ labels: 'a' });
        server.connection({ labels: 'b' });
  
        // defaults
        server.register([
            Inert,
            Vision,
        ], function (err) {
            if (err) {
                throw err;
            }
            
            // interface a
            server.register([plugin1, HapiSwagger], { select: ['a'] }, function (err) {
                if (err) {
                    throw err;
                }
                
                // interface b
                server.register([plugin2, HapiSwagger], { select: ['b'] }, function (err) {
                    if (err) {
                        throw err;
                    }
                    server.start(function () {
                        done();
                    });
                });
            });

        });


    });

    afterEach(function (done) {
        server.stop(function () {
            server = null;
            done();
        });
    });


    describe('connections', function () {

        it('a', function (done) {
            var serverA = server.select('a');
            serverA.inject({ method: 'GET', url: '/docs?path=plugin1' }, function (response) {
                assert.equal(response.result.resourcePath, '/plugin1');
                done();
            });
        });

        it('b', function (done) {
            var serverB = server.select('b');
            serverB.inject({ method: 'GET', url: '/docs?path=plugin2 ' }, function (response) {
                assert.equal(response.result.resourcePath, '/plugin2');
                done();
            });
        });

    });



});
