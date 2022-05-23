// `routes-filtering.js` - how to filter routes to be added to the docs
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
      tags: ['api', 'petstore', 'auth'],
    }
  },
  {
    method: 'GET',
    path: '/petstore',
    options: {
      handler,
      tags: ['api', 'petstore'],
    }
  },
  {
    method: 'GET',
    path: '/petstore/{id}',
    options: {
      handler,
      tags: ['api', 'petstore']
    }
  },
  {
    method: 'POST',
    path: '/petstore/{id}/pet',
    options: {
      handler,
      tags: ['api', 'petstore', 'auth']
    }
  },
  {
    method: 'GET',
    path: '/pet/{id}',
    options: {
      handler,
      tags: ['api', 'pet', 'extra']
    }
  },
  {
    method: 'GET',
    path: '/petstore/{id}/pet',
    options: {
      handler,
      tags: ['api', 'pet']
    }
  }
];

const swaggerOptions = {
  info: {
    title: 'Test API Documentation',
    version: Pack.version
  },
  routeTag: (tags) => tags.includes('pet') && !tags.includes('auth')
};

const ser = async () => {
  const server = Hapi.Server({
    host: 'localhost',
    port: 3000
  });

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
