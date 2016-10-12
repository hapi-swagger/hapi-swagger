'use strict';

// `ssl.js` - how to use many of the plug-in options
const Fs = require('fs');
const Path = require('path');
const Blipp = require('blipp');
const H2o2 = require('h2o2');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');

const HapiSwagger = require('../');
const Pack = require('../package');
let Routes = require('./assets/routes-simple.js');


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

let server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3000, // will get a EACCES on a desktop if you try 443
    tls: {
        key: Fs.readFileSync(Path.join(__dirname, '../test/certs/server.key')),
        cert: Fs.readFileSync(Path.join(__dirname, '../test/certs/server.crt'))
    }
});


let swaggerOptions = {
    basePath: '/v1',
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
    }]
};



server.register([
    Inert,
    Vision,
    Blipp,
    H2o2,
    {
        register: require('good'),
        options: goodOptions
    },
    {
        register: HapiSwagger,
        options: swaggerOptions
    }],
    (err) => {

        if (err) {
            console.log(err);
        }

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
