// `custom.js` - how build a custom documentation page with its own CSS and JS

'use strict';

const Blipp = require('blipp');
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');

const HapiSwagger = require('../');
const Pack = require('../package');
const Routes = require('./assets/routes-simple');

const swaggerOptions = {
  documentationPage: false,
  documentationRouteTags: 'no-logging',
  documentationRoutePlugins: {
    blankie: {
      fontSrc: ['self', 'fonts.gstatic.com', 'data:'],
      scriptSrc: ['self', 'unsafe-inline'],
      styleSrc: ['self', 'fonts.googleapis.com', 'unsafe-inline'],
      imgSrc: ['self', 'data:'],
      generateNonces: false
    }
  },
  swaggerUIPath: '/ui/',
  basePath: '/v1/',
  pathPrefixSize: 2,
  info: {
    title: 'Test API Documentation',
    description: 'This is a sample example of API documentation.',
    version: Pack.version,
    termsOfService: 'https://github.com/@timondev/hapi-swagger/@timondev/hapi-swagger/',
    contact: {
      email: 'glennjonesnet@gmail.com'
    },
    license: {
      name: 'MIT',
      url: 'https://raw.githubusercontent.com/@timondev/hapi-swagger/@timondev/hapi-swagger/master/license.txt'
    }
  },
  tags: [
    {
      name: 'sum',
      description: 'working with maths',
      externalDocs: {
        description: 'Find out more',
        url: 'http://example.org'
      }
    },
    {
      name: 'store',
      description: 'storing data',
      externalDocs: {
        description: 'Find out more',
        url: 'http://example.org'
      }
    }
  ],
  validatorUrl: null
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
