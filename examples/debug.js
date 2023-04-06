// `debug.js` - how to validate swagger output and get warning/error messages during development

'use strict';

const Blipp = require('blipp');
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');

const HapiSwagger = require('../');
const Pack = require('../package');
const Routes = require('./assets/routes-simple.js');

const swaggerOptions = {
  basePath: '/v1',
  pathPrefixSize: 2,
  info: {
    title: 'Test API Documentation',
    version: Pack.version
  },
  debug: true // switch on debug
};

// use chalk to log colour @timondev/hapi-swagger messages to console.
const formatLogEvent = function (event) {
  console.log(`[${event.tags}], ${event.data}`);
};

const ser = async () => {
  const server = Hapi.Server({
    host: 'localhost',
    port: 3000
  });

  // Blipp - Needs updating for Hapi v17.x
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
};

ser()
  .then((server) => {
    console.log(`Server listening on ${server.info.uri}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
