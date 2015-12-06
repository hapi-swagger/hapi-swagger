'use strict';

var Blipp = require('blipp'),
    Hapi = require('hapi'),
    Hoek = require('hoek'),
    Inert = require('inert'),
    Vision = require('vision');

var HapiSwagger = require('../'),
    Pack = require('../package'),
    Routes = require('./routes');


var server = new Hapi.Server();

server.connection({ host: 'localhost', port: 3000, labels: 'a' });
server.connection({ host: 'localhost', port: 3001, labels: 'b' });
server.connection({ host: 'localhost', port: 3002, labels: 'c' });


var plugin1 = function (plugin, options, next) {

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


var plugin2 = function (plugin, options, next) {

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


var swaggerOptions = {
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

var swaggerOptionsA = Hoek.clone(swaggerOptions),
    swaggerOptionsB = Hoek.clone(swaggerOptions);

swaggerOptionsA.host = 'localhost:3000';
swaggerOptionsB.host = 'localhost:3001';

server.register([
    Blipp ,
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

                    });
                });
        });
});


server.route(Routes);

