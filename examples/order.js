'use strict';

// Include Hapi package
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('./index.js');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3000
});

// Register Swagger Plugin ( Use for documentation and testing purpose )
const options = {
    info: {
        'title': 'Test API Documentation',
        'version': '0.0.1',
    },
    sortEndpoints: 'ordered',
    pathReplacements: [{
        replaceIn: 'groups',
        pattern: /pet/,
        replacement: 'wolf'
    }]
};
server.register([
    Inert,
    Vision,
    {
        'register': HapiSwagger,
        'options': options
    }], (err) => {
        if (err) {
            server.log(['error'], 'hapi-swagger load error: ' + err)
        }
        else {
            server.log(['start'], 'hapi-swagger interface loaded')
        }
    }
);

// Add the route
server.route([{
    method: 'POST',
    path: '/petstore',
    config: {
        tags: ['api'],
    },
    handler: function (request, reply) {
        // reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
        reply({
            statusCode: 200
        });
    }
},
{
    method: 'GET',
    path: '/petstore',
    config: {
        tags: ['api'],
    },
    handler: function (request, reply) {
        // reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
        reply({
            statusCode: 200
        });
    }
},
{
    method: 'GET',
    path: '/petstore/{id}',
    config: {
        tags: ['api'],
    },
    handler: function (request, reply) {
        // reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
        reply({
            statusCode: 200
        });
    }
},
{
    method: 'POST',
    path: '/petstore/{id}/pet',
    config: {
        tags: ['api'],
    },
    handler: function (request, reply) {
        // reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
        reply({
            statusCode: 200
        });
    }
},
{
    method: 'GET',
    path: '/pet/{id}',
    config: {
        tags: ['api'],
    },
    handler: function (request, reply) {
        // reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
        reply({
            statusCode: 200
        });
    }
},
{
    method: 'GET',
    path: '/petstore/{id}/pet',
    config: {
        tags: ['api'],
    },
    handler: function (request, reply) {
        // reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
        reply({
            statusCode: 200
        });
    }
}]);





// Start the server
server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});