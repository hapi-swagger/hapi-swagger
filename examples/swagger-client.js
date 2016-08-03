'use strict';

// `swagger-client.js` - how to plug-in to build an interface with `swagger-client`

const Blipp = require('blipp');
const Hapi = require('hapi');
const Joi = require('joi');
const Swagger = require('swagger-client');
const HapiSwagger = require('../');


let server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3000
});


let swaggerOptions = {
    enableDocumentation: false,
    enableSwaggerUI: false,
    tags: [{
        'name': 'sum'
    },{
        'name': 'math'
    },{
        'name': 'mathematics'
    }],
    derefJSONSchema: true
};


const defaultHandler = function (request, reply) {

    let a = parseFloat(request.params.a);
    let b = parseFloat(request.params.b);

    reply({
        'a': a,
        'b': b,
        'operator': '+',
        'equals': a + b,
        'created': new Date().toISOString(),
        'modified': new Date().toISOString()
    });

};



server.register([
    Blipp,
    {
        register: HapiSwagger,
        options: swaggerOptions
    }],
    (err) => {

        if (err) {
            console.log(err);
        }

        /*
        Two of the routes below uses `id: 'add'` in the route options. It is used to make the swagger-client path more human
        readable. ie `sum.add` or `math.add`. If the same `id` is used more than once across the whole API it will make
        json output by the plugin invalid against the OpenAPI spec, but the json should still work in most codegen applications.

        Please `id` with care and remove it if not needed. The mathematics example is created using auto naming without the use of `id`.
        */

        server.route([{
            method: 'PUT',
            path: '/sum/add/{a}/{b}',
            config: {
                handler: defaultHandler,
                description: 'Add',
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        'id': 'add'  // refer to notes above
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
        },{
            method: 'PUT',
            path: '/math/add/{a}/{b}',
            config: {
                handler: defaultHandler,
                description: 'Add',
                tags: ['api'],
                plugins: {
                    'hapi-swagger': {
                        'id': 'add' // refer to notes above
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
        },{
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
        }]);

        server.start((err) => {
            if (err) {
                console.log(err);
            } else {
                console.log('Server running at:', server.info.uri);

                // create swagger client using json output from plugin
                var client = new Swagger({
                    url: server.info.uri + '/swagger.json',
                    success: () => {

                        // call the endpoint
                        client.sum.add({ a: 7, b: 7 }, { responseContentType: 'application/json' }, (result) => {

                            console.log('result', result);
                        });


                        // call the endpoint
                        client.math.add({ a: 8, b: 8 }, { responseContentType: 'application/json' }, (result) => {

                            console.log('result', result);
                        });


                        // call the endpoint
                        client.mathematics.putMathematicsAddAB({ a: 9, b: 9 }, { responseContentType: 'application/json' }, (result) => {

                            console.log('result', result);
                        });
                    }
                });
            }
        });
    });
