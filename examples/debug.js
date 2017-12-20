// `debug.js` - how to validate swagger output and get warning/error messages during development

const Blipp = require('blipp');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const Chalk = require('chalk');

const HapiSwagger = require('../');
const Pack = require('../package');
let Routes = require('./assets/routes-simple.js');



let swaggerOptions = {
    basePath: '/v1',
    pathPrefixSize: 2,
    info: {
        title: 'Test API Documentation',
        version: Pack.version
    },
    debug: true // switch on debug
};

// use chalk to log colour hapi-swagger messages to console.
const formatLogEvent = function(event) {
    if (event.tags.error) {
        console.log(`[${event.tags}], ${Chalk.red(event.data)}`);
    } else {
        console.log(`[${event.tags}], ${Chalk.green(event.data)}`);
    }
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

        server.views({
            path: 'examples/assets',
            engines: { html: require('handlebars') },
            isCached: false
        });


        await server.start();
        server.events.on('log', formatLogEvent);

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
