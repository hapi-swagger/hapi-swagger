'use strict';

// `options.js` - how to use many of the plug-in options

const BearerToken = require('hapi-auth-bearer-token');
const Blipp = require('blipp');
const H2o2 = require('h2o2');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');

const HapiSwagger = require('../');
const Pack = require('../package');
let Routes = require('./assets/routes-complex.js');


/**
 * validation function for bearer strategy
 *
 * @param  {Object} token
 * @param  {Function} callback
 */
const validateBearer = function (token, callback) {

    if (token === '12345') {
        callback(null, true, {
            token: token,
            user: {
                username: 'glennjones',
                name: 'Glenn Jones',
                groups: ['admin', 'user']
            }
        });
    } else {
        // for bad token keep err as null
        callback(null, false, {});
    }
};

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
    port: 3000
});

let swaggerOptions = {
    basePath: '/v1/',
    suppressVersionFromBasePath: true,
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
    jsonEditor: true,
    securityDefinitions: {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'x-keyPrefix': 'Bearer '
        }
    },
    security: [{ 'Bearer': [] }],
    derefJSONSchema: false,
    cache: {
        expiresIn: 24 * 60 * 60 * 1000
    }
};

// swaggerOptions.derefJSONSchema = true;
// swaggerOptions.auth = 'bearer';

// the auth.strategy needs to be registered before it can be used in options for swagger
server.register([BearerToken], (err) => {

    if (err) {
        console.log(err);
    }

    server.auth.strategy('bearer', 'bearer-access-token', {
        'accessTokenName': 'access_token',
        'validateFunc': validateBearer
    });
});

server.ext('onRequest', function (request, reply) {

    //console.log(request.headers.accept);                     // accessing request header
    //reply('My response').header('x-some-header', 'hello');   // setting a response with custom header
    //request.headers.accept = request.headers.Accept;
    return reply.continue();
});


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
