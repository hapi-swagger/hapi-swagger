// `group.js` - how to use tag based grouping
const Blipp = require('blipp');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');

const HapiSwagger = require('../');
const Pack = require('../package');

//
const Routes = [
    {
        method: 'POST',
        path: '/petstore',
        config: {
            handler: (request, reply) => {
                reply({ ok: true });
            },
            description: 'Array properties',
            tags: ['api', 'petstore'],
            plugins: {
                'hapi-swagger': {
                    order: 1
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/petstore',
        config: {
            handler: (request, reply) => {
                reply({ ok: true });
            },
            description: 'Array properties',
            tags: ['api', 'petstore'],
            plugins: {
                'hapi-swagger': {
                    order: 2
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/petstore/{id}',
        config: {
            handler: (request, reply) => {
                reply({ ok: true });
            },
            description: 'Array properties',
            tags: ['api', 'petstore'],
            plugins: {
                'hapi-swagger': {
                    order: 3
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/petstore/{id}/pet',
        config: {
            handler: (request, reply) => {
                reply({ ok: true });
            },
            description: 'Array properties',
            tags: ['api', 'pet'],
            plugins: {
                'hapi-swagger': {
                    order: 4
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/pet/{id}',
        config: {
            handler: (request, reply) => {
                reply({ ok: true });
            },
            description: 'Array properties',
            tags: ['api', 'pet', 'extra'],
            plugins: {
                'hapi-swagger': {
                    order: 5
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/petstore/{id}/pet',
        config: {
            handler: (request, reply) => {
                reply({ ok: true });
            },
            description: 'Array properties',
            tags: ['api', 'pet'],
            plugins: {
                'hapi-swagger': {
                    order: 6
                }
            }
        }
    }
];

/*
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
*/


let swaggerOptions = {
    basePath: '/v1',
    pathPrefixSize: 2,
    info: {
        title: 'Test API Documentation',
        description: 'This is a sample example of API documentation.',
        version: Pack.version
    },
    tags: [
        {
            name: 'petstore',
            description: 'the petstore api'
        },
        {
            name: 'pet',
            description: 'the pet api'
        }
    ],
    grouping: 'tags',
    sortEndpoints: 'ordered'
};

const ser = async () => {

    try {

        const server = Hapi.Server({
            host: 'localhost',
            port: 3000
        });

        // Blipp and Good - Needs updating for Hapi v17.x
        await server.register([
            Inert,
            Vision,
            Blipp,
            {
                plugin: HapiSwagger,
                options: swaggerOptions
            }
        ]);

        server.route(Routes);

        await server.start();

        return server;

    } catch (err) {
        throw err;
    }

};


ser()
    .then((server) => {

        console.log(`Server listening on ${server.info.uri}`);
    })
    .catch((err) => {

        console.error(err);
        process.exit(1);
    });

