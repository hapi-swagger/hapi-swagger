// `jwt.js` - how to used in combination with JSON Web Tokens (JWT) `securityDefinition`

const Hapi = require('@hapi/hapi');
const jwt = require('jsonwebtoken');
const Blipp = require('blipp');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');

const HapiSwagger = require('../');

let swaggerOptions = {
  info: {
    title: 'Test API Documentation',
    description: 'This is a sample example of API documentation.'
  },
  securityDefinitions: {
    jwt: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header'
    }
  }
};

const people = {
  // our "users database"
  56732: {
    id: 56732,
    name: 'Jen Jones',
    scope: ['a', 'b']
  }
};

const privateKey = 'hapi hapi joi joi';
const token = jwt.sign({ id: 56732 }, privateKey, { algorithm: 'HS256' });

// bring your own validation function
const validate = decoded => {
  // do your checks to see if the person is valid
  if (!people[decoded.id]) {
    return { isValid: false };
  } else {
    return { isValid: true };
  }
};

const ser = async () => {
  const server = Hapi.Server({
    host: 'localhost',
    port: 3000
  });

  await server.register([
    require('hapi-auth-jwt2'),
    Inert,
    Vision,
    Blipp,
    {
      plugin: HapiSwagger,
      options: swaggerOptions
    }
  ]);

  server.auth.strategy('jwt', 'jwt', {
    key: privateKey,
    validate,
    verifyOptions: { algorithms: ['HS256'] }
  });

  server.auth.default('jwt');

  server.route([
    {
      method: 'GET',
      path: '/',
      options: {
        auth: false,
        handler: () => {
          return { text: 'Token not required' };
        }
      }
    },
    {
      method: 'GET',
      path: '/restricted',
      options: {
        auth: 'jwt',
        tags: ['api'],
        handler: (request, h) => {
          const response = h.response({
            text: 'You used a Token! ' + request.auth.credentials.name
          });
          response.header('Authorization', request.headers.authorization);
          return response;
        }
      }
    },
    {
      method: 'GET',
      path: '/token',
      options: {
        auth: false,
        tags: ['api'],
        handler: () => {
          return { token: token };
        }
      }
    }
  ]);

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
