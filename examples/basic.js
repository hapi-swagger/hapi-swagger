// `jwt.js` - how to used in combination with JSON Web Tokens (JWT) `securityDefinition`

'use strict';

const Hapi = require('@hapi/hapi');
const Joi = require('joi');
const Basic = require('@hapi/basic');
const Blipp = require('blipp');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');

const HapiSwagger = require('../');

const swaggerOptions = {
  info: {
    title: 'Test API Documentation',
    description: 'This is a sample example of API documentation.'
  },
  auth: 'simple'
};

const users = {
  jane: {
    username: 'jane',
    password: 'password', // in real world store Bcrypt 'secret' here
    name: 'Jane Jones',
    id: '2133d32a'
  }
};

const validate = function (request, username, password) {
  const user = users[username];
  if (!user) {
    return { isValid: false, credentials: null };
  }

  const isValid = password === user.password;
  let credentials = null;
  if (isValid) {
    credentials = { id: user.id, name: user.name };
  }

  return { isValid, credentials };
};

const ser = async () => {
  const server = Hapi.Server({
    host: 'localhost',
    port: 3000
  });

  await server.register(Basic);
  server.auth.strategy('simple', 'basic', { validate });
  server.auth.default('simple');

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

  server.route({
    method: 'PUT',
    path: '/v1/store/{id?}',
    options: {
      handler: function (request, h) {
        return h.response('success');
      },
      description: 'Update sum',
      notes: ['Update a sum in our data store'],
      plugins: {
        '@timondev/hapi-swagger': {
          payloadType: 'form'
        }
      },
      tags: ['api'],
      validate: {
        params: Joi.object({
          id: Joi.string().required().description('the id of the sum in the store')
        }),
        payload: Joi.object({
          a: Joi.number().required().description('the first number'),

          b: Joi.number().required().description('the second number'),

          operator: Joi.string()
            .required()
            .default('+')
            .valid('+', '-', '/', '*')
            .description('the operator i.e. + - / or *'),

          equals: Joi.number().required().description('the result of the sum')
        })
      }
    }
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
