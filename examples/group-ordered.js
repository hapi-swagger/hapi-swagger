// `group-ordered.js` - how to use tag based grouping
'use strict';

const Blipp = require('blipp');
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');

const HapiSwagger = require('../');
const Pack = require('../package');

const handler = (request, reply) => { reply({ ok: true }) }

const Routes = [
  {
    method: 'POST',
    path: '/petstore',
    options: {
      handler,
      description: 'Array properties',
      tags: ['api', 'petstore'],
      plugins: {
        '@timondev/hapi-swagger': {
          order: 1
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/petstore',
    options: {
      handler,
      description: 'Array properties',
      tags: ['api', 'petstore'],
      plugins: {
        '@timondev/hapi-swagger': {
          order: 2
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/petstore/{id}',
    options: {
      handler,
      description: 'Array properties',
      tags: ['api', 'petstore'],
      plugins: {
        '@timondev/hapi-swagger': {
          order: 3
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/petstore/{id}/pet',
    options: {
      handler,
      description: 'Array properties',
      tags: ['api', 'pet'],
      plugins: {
        '@timondev/hapi-swagger': {
          order: 4
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/pet/{id}',
    options: {
      handler,
      description: 'Array properties',
      tags: ['api', 'pet', 'extra'],
      plugins: {
        '@timondev/hapi-swagger': {
          order: 5
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/petstore/{id}/pet',
    options: {
      handler,
      description: 'Array properties',
      tags: ['api', 'pet'],
      plugins: {
        '@timondev/hapi-swagger': {
          order: 6
        }
      }
    }
  }
];

const swaggerOptions = {
  basePath: '/v1',
  pathPrefixSize: 2,
  info: {
    title: 'Test API Documentation',
    description: 'This is a sample example of API documentation.',
    version: Pack.version
  },
  tags: [
    {
      name: 'petstore',
      description: 'the petstore api'
    },
    {
      name: 'pet',
      description: 'the pet api'
    }
  ],
  grouping: 'tags',
  sortEndpoints: 'ordered'
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
