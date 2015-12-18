'use strict';

const Blipp = require('blipp');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Inert = require('inert');
const Vision = require('vision');

const HapiSwagger = require('../');
const Pack = require('../package');
const Routes = require('./routes');


let server = new Hapi.Server();

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
        'version': Pack.version,
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
    Blipp ,
    Inert,
    Vision
], (err) => {

    // interface a - add swagger UI
    server.register([
        plugin1,
        {
            register: HapiSwagger,
            options: swaggerOptionsA
        }], { select: ['a'] }, (err) => {

            // interface b - add swagger UI
            server.register([
                plugin2,
                {
                    register: HapiSwagger,
                    options: swaggerOptionsB
                }], { select: ['b'] }, (err) => {

                    server.start(() => {

                    });
                });
        });
});


server.route(Routes);

