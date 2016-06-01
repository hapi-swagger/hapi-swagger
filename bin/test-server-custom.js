'use strict';
const Blipp = require('blipp');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');

const HapiSwagger = require('../');
const Pack = require('../package');
const Routes = require('./custom-routes');


const goodOptions = {
    reporters: [{
        reporter: require('good-console'),
        events: { log: '*', response: '*' }
    }]
};


let server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3000
});


let swaggerOptions = {
    enableDocumentation: false,
    swaggerUIPath: '/ui/',
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
    }],
    jsonEditor: true,
    validatorUrl: null
};




server.register([
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
    }], (err) => {

        server.route(Routes);

        server.start((err) => {
            if (err) {
                console.log(err);
            } else {
                console.log('Server running at:', server.info.uri);
            }
        });
    });




// add templates only for testing custom.html
server.views({
    path: 'bin',
    engines: { html: require('handlebars') },
    isCached: false
});
