'use strict';

// `extend-joi.js`

// This only works at moment if you have a base JOI type like number.

const Hapi = require('hapi');
const Blipp = require('blipp');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('../');
const ExtendedJoi = require('./assets/extendedjoi.js');


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
    info: {
        'title': 'Test API Documentation',
        'description': 'This is a sample example of API documentation.'
    }
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

        // Start the server
        server.start((err) => {

            if (err) {
                throw err;
            }

            console.log('Server running at:', server.info.uri);
        });

    });



server.route({
    method: 'PUT',
    path: '/sum/dividableby/{number}',
    config: {
        handler: (request, reply) => {
            return reply({
                status: 'OK'
            });
        },
        description: 'Dividable',
        tags: ['api'],
        validate: {
            params: {
                number: ExtendedJoi.number()
                    .round()
                    .dividable(3)
                    .required()
            }
        }
    }
});
