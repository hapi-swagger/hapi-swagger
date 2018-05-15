
console.log('The plugin "hapi-api-version" does not yet support HAPI v17.x. This example will be updated at a later date.');
/*
// `versions.js` - how to use plug-in with `hapi-api-version` for versioning of an API

// This file also shows the use of `pathReplacements` to remove all version numbers in paths
// The routes are versioned ie '/api/v1/users' and '/api/v2/users'

const Hapi = require('hapi');
const Joi = require('joi');
const Blipp = require('blipp');
const Inert = require('inert');
const Vision = require('vision');
const HapiApiVersion = require('hapi-api-version');
const HapiSwagger = require('../');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3000
});

const options = {
    basePath: '/api/',
    validVersions: [1, 2],
    defaultVersion: 2
};

const goodOptions = {
    ops: {
        interval: 1000
    },
    reporters: {
        console: [
            {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [
                    {
                        log: '*',
                        response: '*'
                    }
                ]
            },
            {
                module: 'good-console'
            },
            'stdout'
        ]
    }
};

const versionOptions = {
    basePath: options.basePath,
    validVersions: options.validVersions,
    defaultVersion: options.defaultVersion,
    vendorName: 'mysuperapi'
};

const swaggerOptions = {
    pathPrefixSize: 2,
    basePath: options.basePath,
    info: {
        title: 'Test API Documentation',
        description: 'This is a sample example of API documentation.'
    },
    pathReplacements: [
        {
            replaceIn: 'all',
            pattern: /v([0-9]+)\//,
            replacement: ''
        }
    ],
    deReference: false
};

// Start the server
server.register(
    [
        Inert,
        Vision,
        Blipp,
        {
            register: require('good'),
            options: goodOptions
        },
        {
            register: HapiSwagger,
            options: swaggerOptions
        },
        {
            register: HapiApiVersion,
            options: versionOptions
        }
    ],
    err => {
        if (err) {
            throw err;
        }

        // Add a route - handler and route definition is the same for all versions
        server.route({
            method: 'GET',
            path: '/version',
            handler: function(request, reply) {
                // Return the api-version which was requested
                return reply({
                    version: request.pre.apiVersion
                });
            }
        });

        const usersVersion1Model = Joi.array()
            .items(
                Joi.object({
                    name: Joi.string().label('name')
                }).label('User v1')
            )
            .label('Users v1');

        const usersVersion1 = [
            {
                name: 'Peter Miller'
            }
        ];

        const usersVersion2Model = Joi.array()
            .items(
                Joi.object({
                    firstname: Joi.string().label('firstname'),
                    lastname: Joi.string().label('lastname')
                }).label('User v2')
            )
            .label('Users v2');

        const usersVersion2 = [
            {
                firstname: 'Peter',
                lastname: 'Miller'
            }
        ];

        // Add a versioned route - which is actually two routes with prefix '/v1' and '/v2'. Not only the
        // handlers are different, but also the route definition itself (like here with response validation).
        server.route({
            method: 'GET',
            path: '/api/v1/users',
            handler: function(request, reply) {
                return reply(usersVersion1).type(
                    'application/vnd.mysuperapi.v1+json'
                );
            },
            config: {
                tags: ['api', 'v1'],
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                description: 'Success',
                                schema: usersVersion1Model
                            }
                        }
                    }
                },
                validate: {
                    headers: Joi.object({
                        accept: Joi.string().valid([
                            'application/vnd.mysuperapi.v1+json'
                        ])
                    }).unknown()
                }
            }
        });

        server.route({
            method: 'GET',
            path: '/api/v2/users',
            handler: function(request, reply) {
                return reply(usersVersion2).type(
                    'application/vnd.mysuperapi.v2+json'
                );
            },
            config: {
                tags: ['api', 'v1', 'v2'],
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                description: 'Success',
                                schema: usersVersion2Model
                            }
                        }
                    }
                },
                validate: {
                    headers: Joi.object({
                        accept: Joi.string().valid([
                            'application/vnd.mysuperapi.v2+json',
                            'application/vnd.mysuperapi.v1+json'
                        ])
                    }).unknown()
                }
            }
        });

        server.route({
            method: 'GET',
            path: '/api/v2/users/{id}',
            handler: function(request, reply) {
                return reply(usersVersion2[0]).type(
                    'application/vnd.mysuperapi.v2+json'
                );
            },
            config: {
                tags: ['api', 'v2'],
                plugins: {
                    'hapi-swagger': {
                        responses: {
                            '200': {
                                description: 'Success',
                                schema: usersVersion2Model
                            }
                        }
                    }
                },
                validate: {
                    params: {
                        id: Joi.number().required().description('id of user')
                    },
                    headers: Joi.object({
                        accept: Joi.string().valid([
                            'application/vnd.mysuperapi.v2+json'
                        ])
                    }).unknown()
                }
            }
        });

        // Add a versioned route - This is a simple version of the '/users' route where just the handlers
        // differ and even those just a little. It maybe is the preferred option if just the formatting of
        // the response differs between versions.

        // Start the server
        server.start(err => {
            if (err) {
                throw err;
            }

            console.log('Server running at:', server.info.uri);
        });
    }
);
*/
