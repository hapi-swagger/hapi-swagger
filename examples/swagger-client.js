// `swagger-client.js` - how to plug-in to build an interface with `swagger-client`

const Hapi = require('hapi');
const Joi = require('joi');
const Swagger = require('swagger-client');
const HapiSwagger = require('../');


let swaggerOptions = {
    documentationPage: false,
    swaggerUI: false,
    tags: [
        {
            name: 'sum'
        },
        {
            name: 'math'
        },
        {
            name: 'mathematics'
        }
    ],
    deReference: true
};

const defaultHandler = function(request, h) {
    let a = parseFloat(request.params.a);
    let b = parseFloat(request.params.b);

    return h.response({
        a: a,
        b: b,
        operator: '+',
        equals: a + b,
        created: new Date().toISOString(),
        modified: new Date().toISOString()
    });
};

const routes = [
    {
        method: 'PUT',
        path: '/sum/add/{a}/{b}',
        config: {
            handler: defaultHandler,
            description: 'Add',
            tags: ['api'],
            plugins: {
                'hapi-swagger': {
                    id: 'add' // refer to notes above
                }
            },
            validate: {
                params: {
                    a: Joi.number()
                        .required()
                        .description('the first number'),

                    b: Joi.number()
                        .required()
                        .description('the second number')
                }
            }
        }
    },
    {
        method: 'PUT',
        path: '/math/add/{a}/{b}',
        config: {
            handler: defaultHandler,
            description: 'Add',
            tags: ['api'],
            plugins: {
                'hapi-swagger': {
                    id: 'add' // refer to notes above
                }
            },
            validate: {
                params: {
                    a: Joi.number()
                        .required()
                        .description('the first number'),

                    b: Joi.number()
                        .required()
                        .description('the second number')
                }
            }
        }
    },
    {
        method: 'PUT',
        path: '/mathematics/add/{a}/{b}',
        config: {
            handler: defaultHandler,
            description: 'Add',
            tags: ['api'],
            validate: {
                params: {
                    a: Joi.number()
                        .required()
                        .description('the first number'),

                    b: Joi.number()
                        .required()
                        .description('the second number')
                }
            }
        }
    }
];

const ser = async () => {

    try {

        const server = Hapi.Server({
            host: 'localhost',
            port: 3000
        });

        // Blipp - Needs updating for Hapi v17.x
        await server.register([
            {
                plugin: HapiSwagger,
                options: swaggerOptions
            }
        ]);

        server.route(routes);

        await server.start();
        return server;

    } catch (err) {
        throw err;
    }

};


ser()
    .then((server) => {

        console.log(`Server listening on ${server.info.uri}`);

        // create swagger client using json output from plugin

        Swagger(server.info.uri + '/swagger.json')
            .then(client => {

                // Three calls to API using swagger client

                client.apis.math.add1(
                    { a: 8, b: 8 },
                    { responseContentType: 'application/json' },
                )
                    .then((data) => {
                        console.log(data);
                    })
                    .catch((error) => {
                        console.error(error);
                    });


                client.apis.sum.add2(
                    { a: 7, b: 7 },
                    { responseContentType: 'application/json' },
                )
                    .then((data) => {
                        console.log(data);
                    })
                    .catch((error) => {
                        console.error(error);
                    });


                client.apis.mathematics.putMathematicsAddAB(
                    { a: 9, b: 9 },
                    { responseContentType: 'application/json' },
                )
                    .then((data) => {
                        console.log(data);
                    })
                    .catch((error) => {
                        console.error(error);
                    });


                client.execute({
                    operationId: 'add',
                    parameters: { a: 9, b: 9 }
                })
                    .then((data) => {
                        console.log(data);
                    })
                    .catch((error) => {
                        console.error(error);
                    });

            });


    })
    .catch((err) => {

        console.error(err);
        process.exit(1);
    });
