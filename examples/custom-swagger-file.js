'use strict';

const Hapi = require('@hapi/hapi');
const Blipp = require('blipp');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');

const HapiSwagger = require('..');

const SwaggerJSONFile = require('./assets/swagger.json');

const swaggerOptions = {
  customSwaggerFile: SwaggerJSONFile,
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
