const Code = require('@hapi/code');
const Joi = require('joi');
const Lab = require('@hapi/lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('query', () => {
  lab.test('parameter required', async () => {
    let testRoutes = [{
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
            altParam: Joi.alternatives().try(Joi.number().required(), Joi.string())
          })       
        }
      }
    }];

    const server = await Helper.createServer({}, testRoutes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths['/required'].get.parameters).to.equal([
      {
        type: 'string',
        name: 'requiredParameter',
        in: 'query',
        required: true
      },
      {
        type: 'string',
        name: 'existParameter',
        in: 'query',
        required: true
      },
      {
        type: 'string',
        name: 'defaultParameter',
        in: 'query'
      },
      {
        type: 'string',
        name: 'optionalParameter',
        in: 'query',
        required: false
      }
    ]);

    expect(response.result.paths['/altParam'].get.parameters).to.equal([{
      type: 'number',
      'x-alternatives': [ { type: 'number' }, { type: 'string' } ],
      name: 'altParam',
      in: 'query'
    }]);

    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('parameter of object type', async () => {
    let testRoutes = [{
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
    },{
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
    },{
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
    },{
      method: 'GET',
      path: '/arrayWithItemDescription',
      options: {
        tags: ['api'],
        handler: () => {},
        validate: {
          query: Joi.object({
            arrayParam: Joi.array().items(
              Joi.object({
                stringParam: Joi.string().description('String param description')
              }).description('Item description')
            ).description('Array description')
          })
        }
      }
    }];

    const server = await Helper.createServer({}, testRoutes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths['/emptyobject'].get.parameters).to.equal([{
      type: 'string',
      name: 'objParam',
      in: 'query',
      'x-type': 'object'
    }]);

    expect(response.result.paths['/objectWithProps'].get.parameters).to.equal([{
      type: 'string',
      name: 'objParam',
      in: 'query',
      'x-type': 'object',
      'x-properties': {
        stringParam: {
          type: 'string'
        }
      },
    }]);

    expect(response.result.paths['/arrayOfObjects'].get.parameters).to.equal([{
      type: 'array',
      name: 'arrayParam',
      in: 'query',
      items: {
        type: 'string',
        'x-type': 'object',
        'x-properties': {
          stringParam: {
            type: 'string'
          }
        },
      },
      collectionFormat: 'multi',
    }]);
    expect(response.result.paths['/arrayWithItemDescription'].get.parameters).to.equal([{
      type: 'array',
      name: 'arrayParam',
      in: 'query',
      description: 'Array description',
      items: {
        type: 'string',
        'x-type': 'object',
        'x-properties': {
          stringParam: {
            type: 'string',
            description: 'String param description'
          }
        },
      },
      collectionFormat: 'multi',
    }]);

    const isValid = await Validate.test(response.result, console.log);
    expect(isValid).to.be.true();
  });
});
