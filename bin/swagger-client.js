'use strict';
const Blipp = require('blipp');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const Joi = require('joi');
const Swagger = require('swagger-client');

const HapiSwagger = require('../');
const Pack = require('../package');



let server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3000
});

let swaggerOptions = {
    basePath: '/v1/',
    pathPrefixSize: 2,
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
    },
    tags: [{
        'name': 'sum',
        'description': 'working with maths',
        'externalDocs': {
            'description': 'Find out more',
            'url': 'http://example.org'
        }
    }, {
        'name': 'store',
        'description': 'storing data',
        'externalDocs': {
            'description': 'Find out more',
            'url': 'http://example.org'
        }
    }, {
        'name': 'properties',
        'description': 'test the use of extended hapi/joi properties',
        'externalDocs': {
            'description': 'Find out more',
            'url': 'http://example.org'
        }
    }],
    derefJSONSchema: false
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
    Inert,
    Vision,
    Blipp,
    {
        register: HapiSwagger,
        options: swaggerOptions
    }], (err) => {

        server.route([{
            method: 'PUT',
            path: '/v1/sum/add/{a}/{b}',
            config: {
                handler: defaultHandler,
                description: 'Add',
                tags: ['api', 'reduced'],
                notes: ['Adds together two numbers and return the result. As an option you can have the result return as a binary number.'],
                plugins: {
                    'hapi-swagger': {
                        consumes: ['application/json', 'application/xml']
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
        }]);

        server.start((err) => {
            if (err) {
                console.log(err);
            } else {
                console.log('Server running at:', server.info.uri);

                var client = new Swagger({
                    url: server.info.uri + '/swagger.json',
                    success: () => {

                        client.sum.putV1SumAddAB({ a: 7, b: 7 }, { responseContentType: 'application/json' }, (result) => {

                            console.log('result', result);
                        });
                    }
                });

            }
        });
    });




// add templates only for testing custom.html
server.views({
    path: 'bin',
    engines: { html: require('handlebars') },
    isCached: false
});


