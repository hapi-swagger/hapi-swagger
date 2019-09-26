const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Blipp = require('blipp');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');

const HapiSwagger = require('../');

let swaggerOptions = {
  info: {
    title: 'Test API Documentation',
    description: 'This is a sample example of API documentation.'
  }
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

  server.route({
    method: 'PUT',
    path: '/v1/store/{id?}',
    options: {
      handler: (request, h) => {
        return h.response('success');
      },
      description: 'Update sum',
      notes: ['Update a sum in our data store'],
      plugins: {
        'hapi-swagger': {
          payloadType: 'form'
        }
      },
      tags: ['api'],
      validate: {
        params: Joi.object({
          id: Joi.string()
            .required()
            .description('the id of the sum in the store')
        }),
        payload: Joi.object({
          a: Joi.number()
            .required()
            .description('the first number')
            .default('1'),

          b: Joi.number()
            .required()
            .description('the second number')
            .example('2'),

          operator: Joi.string()
            .required()
            .default('+')
            .valid('+', '-', '/', '*')
            .description('the operator i.e. + - / or *'),

          equals: Joi.number()
            .required()
            .description('the result of the sum')
        })
      }
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
