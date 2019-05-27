// `extend-joi.js`

// This only works at moment if you have a base JOI type like number.

const Hapi = require('@hapi/hapi');
const Blipp = require('blipp');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('../');
const ExtendedJoi = require('./assets/extendedjoi.js');

const swaggerOptions = {
  info: {
    title: 'Test API Documentation',
    description: 'This is a sample example of API documentation.'
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

    server.route({
      method: 'PUT',
      path: '/sum/dividableby/{number}',
      config: {
        handler: (request, h) => {
          return h.response({
            status: 'OK'
          });
        },
        description: 'Dividable',
        tags: ['api'],
        validate: {
          params: {
            number: ExtendedJoi.number()
              .round()
              .dividable(3)
              .required()
          }
        }
      }
    });

    await server.start();

    return server;
  } catch (err) {
    throw err;
  }
};

ser()
  .then(server => {
    console.log(`Server listening on ${server.info.uri}`);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
