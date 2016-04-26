'use strict';
const Blipp = require('blipp');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');

const HapiSwagger = require('../');
let server = new Hapi.Server();

server.connection({ host: 'localhost', port: 3000, labels: 'api', routes: { cors: true } });
server.connection({ host: 'localhost', port: 3001, labels: 'docs' });

let testPlugin = function (plugin, options, next) {


    plugin.route({
        method: 'GET',
        path: '/plugin1',
        config: {
            handler: function (request, reply) {

                reply({ 'msg':'Hi from plugin 1' }).type('application/json');
            },
            description: 'plugin1',
            tags: ['api']
        }
    });

    next();
};
testPlugin.attributes = { name: 'plugin1' };


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
    },
    connectionLabel: 'api'
};

//connectionToDocument: server.select(['api']),

let goodOptions = {
    opsInterval: 1000,
    reporters: [{
        reporter: require('good-console'),
        events: { log: '*', response: '*' }
    }]
};

server.register([
    Inert,
    Vision,
    Blipp,
    {
        register: testPlugin,
        select: ['api']
    },
    {
        register: HapiSwagger,
        options: swaggerOptions,
        select: ['docs']
    }, {
        register: require('good'),
        options: goodOptions,
        select: ['docs', 'api']
    }
], (err) => {

    server.start((err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Server running');
        }
    });
});
