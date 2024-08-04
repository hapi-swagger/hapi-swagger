const Code = require('@hapi/code');
const Joi = require('joi');
const Lab = require('@hapi/lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('array', () => {
  const routes = [
    {
      method: 'POST',
      path: '/store/',
      options: {
        handler: Helper.defaultHandler,
        tags: ['api'],
        validate: {
          payload: Joi.object().keys({
            someIds: Joi.array().items(Joi.number(), Joi.string())
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/store/',
      options: {
        handler: Helper.defaultHandler,
        tags: ['api'],
        response: {
          status: {
            200: Joi.object().keys({
              objectIds: Joi.array().items(
                Joi.object().keys({ id: Joi.number() }),
                Joi.object().keys({ id: Joi.string() })
              )
            })
          }
        }
      }
    },
    {
      method: 'PUT',
      path: '/store/',
      options: {
        handler: Helper.defaultHandler,
        tags: ['api'],
        validate: {
          payload: Joi.object().keys({
            ids: Joi.array().items(Joi.object().keys({ id: Joi.number() }))
          })
        }
      }
    },
    {
      method: 'POST',
      path: '/store-2/',
      options: {
        handler: Helper.defaultHandler,
        tags: ['api'],
        validate: {
          payload: Joi.object().keys({
            ids: Joi.array().items()
          })
        }
      }
    }
  ];

  lab.experiment('OpenAPI v2', () => {
    lab.test('With multiple items should pick the first', async () => {
      const server = await Helper.createServer({}, routes);
      const response = await server.inject({ method: 'GET', url: '/swagger.json' });

      expect(response.statusCode).to.equal(200);

      expect(response.result.definitions.Model1).to.equal({
        type: 'object',
        properties: {
          id: {
            type: 'number'
          }
        }
      });

      expect(response.result.definitions.objectIds).to.equal({
        type: 'array',
        items: {
          $ref: '#/definitions/Model1'
        }
      });

      expect(response.result.definitions.Model2).to.equal({
        type: 'object',
        properties: {
          objectIds: {
            $ref: '#/definitions/objectIds'
          }
        }
      });

      expect(response.result.paths['/store/'].get.responses).to.equal({
        200: {
          description: 'Successful',
          schema: {
            $ref: '#/definitions/Model2'
          }
        }
      });

      const isValid = await Validate.test(response.result);
      expect(isValid).to.be.true();
    });

    lab.test('With one item', async () => {
      const server = await Helper.createServer({}, routes);
      const response = await server.inject({ method: 'GET', url: '/swagger.json' });

      expect(response.statusCode).to.equal(200);

      expect(response.result.definitions.Model5).to.equal({
        type: 'object',
        properties: {
          id: {
            type: 'number'
          }
        }
      });

      expect(response.result.definitions.Model6).to.equal({
        type: 'array',
        items: {
          $ref: '#/definitions/Model5'
        }
      });

      expect(response.result.definitions.Model7).to.equal({
        type: 'object',
        properties: {
          ids: {
            $ref: '#/definitions/Model6'
          }
        }
      });

      expect(response.result.paths['/store/'].put.parameters[0]).to.equal({
        in: 'body',
        name: 'body',
        schema: { $ref: '#/definitions/Model7' }
      });

      const isValid = await Validate.test(response.result);
      expect(isValid).to.be.true();
    });

    lab.test('Without items', async () => {
      const server = await Helper.createServer({}, routes);
      const response = await server.inject({ method: 'GET', url: '/swagger.json' });

      expect(response.statusCode).to.equal(200);

      expect(response.result.definitions.ids).to.equal({
        type: 'array',
        items: {
          type: 'string'
        }
      });

      expect(response.result.definitions.Model4).to.equal({
        type: 'object',
        properties: {
          ids: {
            $ref: '#/definitions/ids'
          }
        }
      });

      expect(response.result.paths['/store-2/'].post.parameters[0]).to.equal({
        in: 'body',
        name: 'body',
        schema: { $ref: '#/definitions/Model4' }
      });

      const isValid = await Validate.test(response.result);
      expect(isValid).to.be.true();
    });
  });

  lab.experiment('OpenAPI v3', () => {
    lab.test('With multiple items', async () => {
      const server = await Helper.createServer({ OAS: 'v3.0' }, routes);
      const response = await server.inject({ method: 'GET', url: '/openapi.json' });

      expect(response.statusCode).to.equal(200);

      expect(response.result.components.schemas.someIds).to.equal({
        type: 'array',
        items: {
          anyOf: [{ type: 'number' }, { type: 'string' }]
        }
      });

      expect(response.result.components.schemas.Model4).to.equal({
        type: 'object',
        properties: {
          someIds: {
            $ref: '#/components/schemas/someIds'
          }
        }
      });

      expect(response.result.paths['/store/'].post.requestBody).to.equal({
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Model4'
            }
          }
        }
      });

      const isValid = await Validate.test(response.result);
      expect(isValid).to.be.true();
    });

    lab.test('With one item', async () => {
      const server = await Helper.createServer({ OAS: 'v3.0' }, routes);
      const response = await server.inject({ method: 'GET', url: '/openapi.json' });

      expect(response.statusCode).to.equal(200);

      expect(response.result.components.schemas.Model6).to.equal({
        type: 'object',
        properties: {
          id: {
            type: 'number'
          }
        }
      });

      expect(response.result.components.schemas.Model7).to.equal({
        type: 'array',
        items: {
          $ref: '#/components/schemas/Model6'
        }
      });

      expect(response.result.components.schemas.Model8).to.equal({
        type: 'object',
        properties: {
          ids: {
            $ref: '#/components/schemas/Model7'
          }
        }
      });

      expect(response.result.paths['/store/'].put.requestBody).to.equal({
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Model8'
            }
          }
        }
      });

      const isValid = await Validate.test(response.result);
      expect(isValid).to.be.true();
    });

    lab.test('Without items', async () => {
      const server = await Helper.createServer({ OAS: 'v3.0' }, routes);
      const response = await server.inject({ method: 'GET', url: '/openapi.json' });

      expect(response.statusCode).to.equal(200);

      expect(response.result.components.schemas.ids).to.equal({
        type: 'array',
        items: {
          type: 'string'
        }
      });

      expect(response.result.components.schemas.Model5).to.equal({
        type: 'object',
        properties: {
          ids: {
            $ref: '#/components/schemas/ids'
          }
        }
      });

      expect(response.result.paths['/store-2/'].post.requestBody).to.equal({
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Model5'
            }
          }
        }
      });

      const isValid = await Validate.test(response.result);
      expect(isValid).to.be.true();
    });
  });
});
