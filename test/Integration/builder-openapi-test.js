const Joi = require('joi');
const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

const routes = [
  {
    method: 'GET',
    path: '/test',
    handler: Helper.defaultHandler,
    options: {
      tags: ['api']
    }
  },
  {
    method: 'GET',
    path: '/test2',
    handler: Helper.defaultHandler,
    options: {
      tags: ['api2']
    }
  },
  {
    method: 'GET',
    path: '/not-part-of-api',
    handler: Helper.defaultHandler,
    options: {
      tags: ['other']
    }
  }
];

const xPropertiesRoutes = [
  {
    method: 'POST',
    path: '/test',
    handler: Helper.defaultHandler,
    options: {
      tags: ['api'],
      validate: {
        payload: Joi.object({
          number: Joi.number().greater(10),
          string: Joi.string().alphanum(),
          array: Joi.array().items(Joi.string()).length(2)
        })
      }
    }
  }
];

const reuseModelsRoutes = [
  {
    method: 'POST',
    path: '/test',
    handler: Helper.defaultHandler,
    options: {
      tags: ['api'],
      validate: {
        payload: Joi.object({
          a: Joi.object({ a: Joi.string() }),
          b: Joi.object({ a: Joi.string() })
        })
      }
    }
  }
];

lab.experiment('builder', () => {
  lab.test('defaults for openapi root object properties', async () => {
    const server = await Helper.createServer({ OAS: 'v3.0' }, routes);
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });

    expect(response.statusCode).to.equal(200);
    expect(response.result.openapi).to.equal('3.0.0');
    expect(response.result.servers).to.have.length(1);
    expect(response.result.servers[0]).to.only.include('url');
    expect(response.result.servers[0].url).to.be.a.string().and.startWith('http://');
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('set values for openapi root object properties', async () => {
    const swaggerOptions = {
      OAS: 'v3.0',
      servers: [{ url: 'https://server/base' }],
      consumes: ['application/x-www-form-urlencoded'],
      produces: ['application/json', 'application/xml'],
      externalDocs: {
        description: 'Find out more about Hapi',
        url: 'http://hapijs.com'
      },
      'x-custom': 'custom'
    };

    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });

    expect(response.statusCode).to.equal(200);
    expect(response.result.openapi).to.equal('3.0.0');
    expect(response.result.servers).to.equal([{ url: 'https://server/base' }]);
    expect(response.result.consumes).to.not.exist(); // .equal(['application/x-www-form-urlencoded']);
    expect(response.result.produces).to.not.exist(); // to.equal(['application/json', 'application/xml']);
    expect(response.result.externalDocs).to.equal(swaggerOptions.externalDocs);
    expect(response.result['x-custom']).to.equal('custom');
    expect(response.result.paths['/test'].get.responses).to.equal({
      default: {
        description: 'Successful',
        content: {
          'application/json': {
            schema: {
              type: 'string'
            }
          },
          'application/xml': {
            schema: {
              type: 'string'
            }
          }
        }
      }
    });
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('xProperties : false', async () => {
    const server = await Helper.createServer({ OAS: 'v3.0', xProperties: false }, xPropertiesRoutes);
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });

    expect(response.result.components.schemas).to.equal({
      array: {
        type: 'array',
        items: {
          type: 'string'
        }
      },
      Model1: {
        type: 'object',
        properties: {
          number: {
            type: 'number'
          },
          string: {
            type: 'string'
          },
          array: {
            $ref: '#/components/schemas/array'
          }
        }
      }
    });

    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('xProperties : true', async () => {
    const server = await Helper.createServer({ OAS: 'v3.0', xProperties: true }, xPropertiesRoutes);
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });

    expect(response.result.components.schemas).to.equal({
      array: {
        type: 'array',
        'x-constraint': {
          length: 2
        },
        items: {
          type: 'string'
        }
      },
      Model1: {
        type: 'object',
        properties: {
          number: {
            type: 'number',
            'x-constraint': {
              greater: 10
            }
          },
          string: {
            type: 'string',
            'x-format': {
              alphanum: true
            }
          },
          array: {
            $ref: '#/components/schemas/array'
          }
        }
      }
    });

    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test(
    'reuseDefinitions : true. It should not be reused, because of the exact definition, but a different label.',
    async () => {
      const server = await Helper.createServer({ OAS: 'v3.0', reuseDefinitions: true }, reuseModelsRoutes);
      const response = await server.inject({ method: 'GET', url: '/openapi.json' });

      expect(response.result.components.schemas).to.equal({
        a: {
          type: 'object',
          properties: {
            a: {
              type: 'string'
            }
          }
        },
        b: {
          type: 'object',
          properties: {
            a: {
              type: 'string'
            }
          }
        },
        Model1: {
          type: 'object',
          properties: {
            a: {
              $ref: '#/components/schemas/a'
            },
            b: {
              $ref: '#/components/schemas/b'
            }
          }
        }
      });

      const isValid = await Validate.test(response.result);
      expect(isValid).to.be.true();
    }
  );

  lab.test('reuseDefinitions : false', async () => {
    const server = await Helper.createServer({ OAS: 'v3.0', reuseDefinitions: false }, reuseModelsRoutes);
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });

    //console.log(JSON.stringify(response.result));
    expect(response.result.components.schemas).to.equal({
      a: {
        type: 'object',
        properties: {
          a: {
            type: 'string'
          }
        }
      },
      b: {
        type: 'object',
        properties: {
          a: {
            type: 'string'
          }
        }
      },
      Model1: {
        type: 'object',
        properties: {
          a: {
            $ref: '#/components/schemas/a'
          },
          b: {
            $ref: '#/components/schemas/b'
          }
        }
      }
    });

    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('getSwaggerJSON determines host and port from request info', async () => {
    const server = await Helper.createServer({ OAS: 'v3.0' });

    const response = await server.inject({
      method: 'GET',
      headers: { host: '194.148.15.24:7645' },
      url: '/openapi.json'
    });

    expect(response.statusCode).to.equal(200);
    expect(response.result.servers).to.equal([{ url: 'http://194.148.15.24:7645' }]);
  });

  lab.test("getSwaggerJSON doesn't specify port from request info when port is default", async () => {
    const server = await Helper.createServer({ OAS: 'v3.0' });

    const response = await server.inject({
      method: 'GET',
      headers: { host: '194.148.15.24' },
      url: '/openapi.json'
    });

    expect(response.statusCode).to.equal(200);
    expect(response.result.servers).to.equal([{ url: 'http://194.148.15.24' }]);
  });

  lab.test('routeTag : "api"', async () => {
    const server = await Helper.createServer({ OAS: 'v3.0', routeTag: 'api' }, routes);
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });

    expect(response.result.paths['/test']).to.equal({
      get: {
        operationId: 'getTest',
        responses: {
          default: {
            description: 'Successful',
            content: {
              'application/json': {
                schema: {
                  type: 'string'
                }
              }
            }
          }
        },
        tags: ['test']
      }
    });
    expect(response.result.paths['/test2']).to.equal(undefined);
    expect(response.result.paths['/not-part-of-api']).to.equal(undefined);

    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('routeTag : "api2"', async () => {
    const server = await Helper.createServer({ OAS: 'v3.0', routeTag: 'api2' }, routes);
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });

    expect(response.result.paths['/test']).to.equal(undefined);
    expect(response.result.paths['/test2']).to.equal({
      get: {
        operationId: 'getTest2',
        responses: {
          default: {
            description: 'Successful',
            content: {
              'application/json': {
                schema: {
                  type: 'string'
                }
              }
            }
          }
        },
        tags: ['test2']
      }
    });
    expect(response.result.paths['/not-part-of-api']).to.equal(undefined);

    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });
});

lab.experiment('builder', () => {
  let logs = [];
  lab.before(async () => {
    const server = await Helper.createServer({ OAS: 'v3.0', debug: true }, reuseModelsRoutes);

    return new Promise((resolve) => {
      server.events.on('log', (event) => {
        logs = event.tags;
        //console.log(event);
        if (event.data === 'PASSED - The swagger.json validation passed.') {
          logs = event.tags;
          resolve();
        }
      });
      server.inject({ method: 'GET', url: '/openapi.json' });
    });
  });

  lab.test('debug : true', () => {
    expect(logs).to.equal(['hapi-swagger', 'validation', 'info']);
  });
});

lab.experiment('fix issue 711', () => {
  lab.test('The description field is shown when an object is empty', async () => {
    const routes = {
      method: 'POST',
      path: '/todo/{id}/',
      options: {
        handler: () => {},
        description: 'Test',
        notes: 'Test notes',
        tags: ['api'],
        validate: {
          payload: Joi.object().description('MyDescription').label('MySchema')
        }
      }
    };

    const server = await Helper.createServer({ OAS: 'v3.0', debug: true }, routes);
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });
    expect(response.statusCode).to.equal(200);

    const { MySchema } = response.result.components.schemas;
    expect(MySchema).not.to.equal({ type: 'object' });
    expect(MySchema).to.equal({ type: 'object', description: 'MyDescription' });
  });
});
