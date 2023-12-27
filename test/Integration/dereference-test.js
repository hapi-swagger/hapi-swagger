const Code = require('@hapi/code');
const Joi = require('joi');
const Lab = require('@hapi/lab');
const Builder = require('../../lib/builder.js');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('dereference', () => {
  const routes = [
    {
      method: 'POST',
      path: '/store/',
      options: {
        handler: Helper.defaultHandler,
        tags: ['api'],
        validate: {
          payload: Joi.object({
            a: Joi.number(),
            b: Joi.number(),
            operator: Joi.string(),
            equals: Joi.number()
          })
        }
      }
    }
  ];

  lab.test('flatten with no references', async () => {
    const server = await Helper.createServer({ deReference: true }, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths['/store/'].post.parameters).to.equal([
      {
        in: 'body',
        name: 'body',
        schema: {
          properties: {
            a: {
              type: 'number'
            },
            b: {
              type: 'number'
            },
            operator: {
              type: 'string'
            },
            equals: {
              type: 'number'
            }
          },
          type: 'object'
        }
      }
    ]);
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('flatten with no references on OAS v3', async () => {
    const server = await Helper.createServer({ deReference: true, OAS: 'v3.0' }, routes);
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });
    expect(response.result.components).not.exists();
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths['/store/'].post.requestBody.content).to.equal({
      "application/json": {
        schema: {
          properties: {
            a: {
              type: 'number'
            },
            b: {
              type: 'number'
            },
            operator: {
              type: 'string'
            },
            equals: {
              type: 'number'
            }
          },
          type: 'object'
        }
      }
    });
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('flatten with no references (OpenAPI)', async () => {
    const server = await Helper.createServer({ OAS: 'v3.0', deReference: true }, routes);
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths['/store/'].post.requestBody).to.equal({
      content: {
        'application/json': {
          schema: {
            properties: {
              a: {
                type: 'number'
              },
              b: {
                type: 'number'
              },
              operator: {
                type: 'string'
              },
              equals: {
                type: 'number'
              }
            },
            type: 'object'
          }
        }
      }
    });
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('dereferences error', async () => {
    try {
      await Builder.dereference(null);
    } catch (err) {
      expect(err).to.exists();
      expect(err.message).to.equal('failed to dereference schema');
    }
  });
});
