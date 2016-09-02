'use strict';

// `debug.js` - how to validate swagger output and get warning/error messages during development

const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const Chalk = require('chalk');

const HapiSwagger = require('../');
const Pack = require('../package');
let Routes = require('./assets/routes-simple.js');



let server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3000
});

let swaggerOptions = {
    basePath: '/v1',
    pathPrefixSize: 2,
    info: {
        'title': 'Test API Documentation',
        'version': Pack.version
    },
    debug: true  // switch on debug
};


// use chalk to log colour hapi-swagger messages to console.
const formatLogEvent = function (event) {

    if (event.tags.error) {
        console.log(`[${event.tags}], ${Chalk.red(event.data)}`);
    } else {
        console.log(`[${event.tags}], ${Chalk.green(event.data)}`);
    }
};
server.on('log', formatLogEvent);



server.register([
    Inert,
    Vision,
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
