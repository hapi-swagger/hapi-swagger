// `ssl.js` - how to use many of the plug-in options
'use strict';

const Fs = require('fs');
const Path = require('path');
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
    },
    {
      name: 'properties',
      description: 'test the use of extended hapi/joi properties',
      externalDocs: {
        description: 'Find out more',
        url: 'http://example.org'
      }
    }
  ]
};

const ser = async () => {
  const server = Hapi.Server({
    host: 'localhost',
    port: 3000,
    tls: {
      key: Fs.readFileSync(Path.join(__dirname, '../test/certs/server.key')),
      cert: Fs.readFileSync(Path.join(__dirname, '../test/certs/server.crt'))
    }
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
