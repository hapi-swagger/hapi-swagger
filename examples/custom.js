// `custom.js` - how build a custom documentation page with its own CSS and JS

const Blipp = require('blipp');
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const Good = require('good');

const HapiSwagger = require('../');
const Pack = require('../package');
let Routes = require('./assets/routes-simple');

const goodOptions = {
  ops: {
    interval: 1000
  },
  reporters: {
    myConsoleReporter: [
      {
        module: '@hapi/good-squeeze',
        name: 'Squeeze',
        args: [
          {
            log: '*',
            response: {
              exclude: ['no-logging']
            }
          }
        ]
      },
      {
        module: 'good-console'
      },
      'stdout'
    ]
  }
};

let swaggerOptions = {
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
    termsOfService: 'https://github.com/glennjones/hapi-swagger/',
    contact: {
      email: 'glennjonesnet@gmail.com'
    },
    license: {
      name: 'MIT',
      url: 'https://raw.githubusercontent.com/glennjones/hapi-swagger/master/license.txt'
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

  // Blipp and Good - Needs updating for Hapi v17.x
  await server.register([
    Inert,
    Vision,
    Blipp,
    {
      plugin: Good,
      options: goodOptions
    },
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
  .then(server => {
    console.log(`Server listening on ${server.info.uri}`);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
