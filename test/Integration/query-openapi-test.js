const Code = require('@hapi/code');
const Joi = require('joi');
const Lab = require('@hapi/lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('query (OpenAPI)', () => {
  lab.test('parameter required', async () => {
    const testRoutes = [
      {
        method: 'GET',
        path: '/required',
        options: {
          handler: () => {},
          tags: ['api'],
          validate: {
            query: Joi.object({
              requiredParameter: Joi.string().required(),
              existParameter: Joi.string().exist(),
              defaultParameter: Joi.string(),
              optionalParameter: Joi.string().optional()
            })
          }
        }
      },
      {
        method: 'GET',
        path: '/altParam',
        options: {
          handler: () => {},
          tags: ['api'],
          validate: {
            query: Joi.object({
              altParam: Joi.alternatives().try(Joi.number(), Joi.string())
            })
          }
        }
      }
    ];

    const server = await Helper.createServer({ OAS: 'v3.0' }, testRoutes);
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths['/required'].get.parameters).to.equal([
      {
        name: 'requiredParameter',
        in: 'query',
        required: true,
        schema: {
          type: 'string'
        }
      },
      {
        name: 'existParameter',
        in: 'query',
        required: true,
        schema: {
          type: 'string'
        }
      },
      {
        name: 'defaultParameter',
        in: 'query',
        schema: {
          type: 'string'
        }
      },
      {
        name: 'optionalParameter',
        in: 'query',
        schema: {
          type: 'string'
        }
      }
    ]);

    expect(response.result.paths['/altParam'].get.parameters).to.equal([
      {
        name: 'altParam',
        in: 'query',
        schema: {
          anyOf: [{ type: 'number' }, { type: 'string' }]
        }
      }
    ]);

    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('parameter of object type', async () => {
    const testRoutes = [
      {
        method: 'GET',
        path: '/emptyobject',
        options: {
          tags: ['api'],
          handler: () => {},
          validate: {
            query: Joi.object({
              objParam: Joi.object()
            })
          }
        }
      },
      {
        method: 'GET',
        path: '/objectWithProps',
        options: {
          tags: ['api'],
          handler: () => {},
          validate: {
            query: Joi.object({
              objParam: Joi.object({
                stringParam: Joi.string()
              })
            })
          }
        }
      },
      {
        method: 'GET',
        path: '/arrayOfObjects',
        options: {
          tags: ['api'],
          handler: () => {},
          validate: {
            query: Joi.object({
              arrayParam: Joi.array().items({
                stringParam: Joi.string()
              })
            })
          }
        }
      },
      {
        method: 'GET',
        path: '/arrayWithItemDescription',
        options: {
          tags: ['api'],
          handler: () => {},
          validate: {
            query: Joi.object({
              arrayParam: Joi.array()
                .items(
                  Joi.object({
                    stringParam: Joi.string().description('String param description')
                  }).description('Item description')
                )
                .description('Array description')
            })
          }
        }
      }
    ];

    const server = await Helper.createServer({ OAS: 'v3.0' }, testRoutes);
    const response = await server.inject({ method: 'GET', url: '/openapi.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths['/emptyobject'].get.parameters).to.equal([
      {
        name: 'objParam',
        in: 'query',
        schema: {
          type: 'object'
        }
      }
    ]);

    expect(response.result.paths['/objectWithProps'].get.parameters).to.equal([
      {
        name: 'objParam',
        in: 'query',
        schema: {
          type: 'object',
          properties: {
            stringParam: {
              type: 'string'
            }
          }
        }
      }
    ]);

    expect(response.result.paths['/arrayOfObjects'].get.parameters).to.equal([
      {
        name: 'arrayParam',
        in: 'query',
        style: 'form',
        explode: true,
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stringParam: {
                type: 'string'
              }
            }
          }
        }
      }
    ]);
    expect(response.result.paths['/arrayWithItemDescription'].get.parameters).to.equal([
      {
        name: 'arrayParam',
        in: 'query',
        description: 'Array description',
        style: 'form',
        explode: true,
        schema: {
          type: 'array',
          description: 'Array description',
          items: {
            type: 'object',
            description: 'Item description',
            properties: {
              stringParam: {
                type: 'string',
                description: 'String param description'
              }
            }
          }
        }
      }
    ]);

    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });
});
