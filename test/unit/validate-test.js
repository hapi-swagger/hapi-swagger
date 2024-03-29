const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

const swaggerJSON = {
  swagger: '2.0',
  host: 'localhost:3000',
  basePath: '/v1',
  schemes: ['http'],
  info: {
    title: 'Test API Documentation',
    version: '7.0.0'
  },
  paths: {
    '/test': {
      post: {
        operationId: 'postTest',
        parameters: [
          {
            in: 'body',
            name: 'body',
            schema: {
              $ref: '#/definitions/Model1'
            }
          }
        ],
        tags: ['test'],
        responses: {
          default: {
            schema: {
              type: 'string'
            },
            description: 'Successful'
          }
        }
      }
    }
  },
  definitions: {
    Model1: {
      type: 'object',
      properties: {
        a: {
          type: 'string'
        }
      }
    }
  }
};

const openAPIJSON = {
  openapi: '3.0.0',
  servers: [{ url: 'http://localhost:3000/v1' }],
  info: {
    title: 'Test API Documentation',
    version: '7.0.0'
  },
  paths: {
    '/test': {
      post: {
        operationId: 'postTest',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Model1'
              }
            }
          }
        },
        tags: ['test'],
        responses: {
          default: {
            content: {
              'application/json': {
                schema: {
                  type: 'string'
                }
              }
            },
            description: 'Successful'
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Model1: {
        type: 'object',
        properties: {
          a: {
            type: 'string'
          }
        }
      }
    }
  }
};

[swaggerJSON, openAPIJSON].forEach((json) => {
  lab.experiment('validate - log ', () => {
    lab.test('bad schema', async () => {
      const cb = (tags) => {
        expect(tags).to.equal(['validation', 'error']);
      };

      const isValid = await Validate.log({}, cb);
      expect(isValid).to.false();
    });

    lab.test('good schema', async () => {
      const cb = (tags) => {
        expect(tags).to.equal(['validation', 'info']);
      };

      const isValid = await Validate.log(json, cb);
      expect(isValid).to.true();
    });
  });

  lab.experiment('validate - test ', () => {
    lab.test('bad schema', async () => {
      const status = await Validate.test({});
      expect(status).to.equal(false);
    });

    lab.test('good schema', async () => {
      const status = await Validate.test(json);
      expect(status).to.equal(true);
    });
  });
});
