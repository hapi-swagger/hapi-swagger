'use strict';
const Code = require('code');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Inert = require('inert');
const Lab = require('lab');
const Vision = require('vision');
const HapiSwagger = require('../lib/index.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('connections', () => {

    const server = new Hapi.Server();

    lab.before(function ( done ){

        server.connection({ host: 'localhost', port: 3000, labels: 'a' });
        server.connection({ host: 'localhost', port: 3001, labels: 'b' });
        server.connection({ host: 'localhost', port: 3002, labels: 'c' });

        let plugin1 = function (plugin, options, next) {

            plugin.route({
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


        let plugin2 = function (plugin, options, next) {

            plugin.route({
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


        let swaggerOptions = {
            schemes: ['http'],
            info: {
                'title': 'Test API Documentation',
                'description': 'This is a sample example of API documentation.',
                'version': '1.0.0',
                'termsOfService': 'https://github.com/glennjones/hapi-swagger/',
                'contact': {
                    'email': 'glennjonesnet@gmail.com'
                },
                'license': {
                    'name': 'MIT',
                    'url': 'https://raw.githubusercontent.com/glennjones/hapi-swagger/master/license.txt'
                }
            }
        };

        let swaggerOptionsA = Hoek.clone(swaggerOptions);
        let swaggerOptionsB = Hoek.clone(swaggerOptions);

        swaggerOptionsA.host = 'localhost:3000';
        swaggerOptionsB.host = 'localhost:3001';

        server.register([
            Inert,
            Vision
        ], function (err) {

            // interface a - add swagger UI
            server.register([
                plugin1,
                {
                    register: HapiSwagger,
                    options: swaggerOptionsA
                }], { select: ['a'] }, function (err) {

                    // interface b - add swagger UI
                    server.register([
                        plugin2,
                        {
                            register: HapiSwagger,
                            options: swaggerOptionsB
                        }], { select: ['b'] }, function (err) {

                            server.start(function () {

                                done();
                            });
                        });
                });
        });

    });




    lab.test('server connection a', (done) => {

        const a = server.select('a');
        a.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

            expect(response.statusCode).to.equal(200);
            done();
        });
    });


    lab.test('server connection b', (done) => {

        const b = server.select('b');
        b.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

            expect(response.statusCode).to.equal(200);
            done();
        });
    });


    lab.test('server connection c', (done) => {

        const c = server.select('c');
        c.inject({ method: 'GET', url: '/swagger.json' }, function (response) {

            expect(response.statusCode).to.equal(404);
            done();
        });
    });


});
