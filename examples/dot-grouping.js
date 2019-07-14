// `dot-grouping.js`

// This file also shows the use of `pathReplacements` to group endpoints by replacing `.` with '/`
// in the group naming

const Hapi = require('@hapi/hapi');
const Blipp = require('blipp');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('../');

const swaggerOptions = {
  pathPrefixSize: 2,
  basePath: '/api/',
  info: {
    title: 'Test API Documentation',
    description: 'This is a sample example of API documentation.'
  },
  pathReplacements: [
    {
      replaceIn: 'groups',
      pattern: /[.].*$/,
      replacement: '/'
    }
  ]
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

  // Add a route - handler and route definition is the same for all versions
  server.route({
    method: 'GET',
    path: '/version',
    handler: function(request, reply) {
      // Return the api-version which was requested
      return reply({
        version: request.pre.apiVersion
      });
    }
  });

  const users = [
    {
      firstname: 'Peter',
      lastname: 'Miller'
    }
  ];

  // Add a versioned route - which is actually two routes with prefix '/v1' and '/v2'. Not only the
  // handlers are different, but also the route definition itself (like here with response validation).
  server.route({
    method: 'GET',
    path: '/api/user.get',
    handler: function(request, h) {
      return h.response(users);
    },
    options: {
      tags: ['api']
    }
  });

  server.route({
    method: 'GET',
    path: '/api/user.search',
    handler: function(request, h) {
      return h.response(users);
    },
    options: {
      tags: ['api']
    }
  });

  await server.start();

  return server;
};

ser()
  .then(server => {
    console.log(`Server listening on ${server.info.uri}`);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
