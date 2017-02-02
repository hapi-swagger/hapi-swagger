'use strict';

// `dot-grouping.js`

// This file also shows the use of `pathReplacements` to group endpoints by replacing `.` with '/`
// in the group naming

const Hapi = require('hapi');
const Blipp = require('blipp');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('../');


// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3000
});


const goodOptions = {
    ops: {
        interval: 1000
    },
    reporters: {
        console: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{
                log: '*',
                response: '*'
            }]
        }, {
            module: 'good-console'
        }, 'stdout']
    }
};


const swaggerOptions = {
    pathPrefixSize: 2,
    basePath: '/api/',
    info: {
        'title': 'Test API Documentation',
        'description': 'This is a sample example of API documentation.'
    },
    pathReplacements: [{
        replaceIn: 'groups',
        pattern: /[.].*$/,
        replacement: '/'
    }]
};


// Start the server
server.register([
    Inert,
    Vision,
    Blipp,
    {
        register: require('good'),
        options: goodOptions
    }, {
        register: HapiSwagger,
        options: swaggerOptions
    }],
    (err) => {

        if (err) {
            throw err;
        }

        // Add a route - handler and route definition is the same for all versions
        server.route({
            method: 'GET',
            path: '/version',
            handler: function (request, reply) {

                // Return the api-version which was requested
                return reply({
                    version: request.pre.apiVersion
                });
            }
        });


        const users = [{
            firstname: 'Peter',
            lastname: 'Miller'
        }];


        // Add a versioned route - which is actually two routes with prefix '/v1' and '/v2'. Not only the
        // handlers are different, but also the route definition itself (like here with response validation).
        server.route({
            method: 'GET',
            path: '/api/user.get',
            handler: function (request, reply) {

                return reply(users);
            },
            config: {
                tags: ['api']
            }
        });

        server.route({
            method: 'GET',
            path: '/api/user.search',
            handler: function (request, reply) {

                return reply(users);
            },
            config: {
                tags: ['api']
            }
        });





        // Add a versioned route - This is a simple version of the '/users' route where just the handlers
        // differ and even those just a little. It maybe is the preferred option if just the formatting of
        // the response differs between versions.

        // Start the server
        server.start((err) => {

            if (err) {
                throw err;
            }

            console.log('Server running at:', server.info.uri);
        });

    });
