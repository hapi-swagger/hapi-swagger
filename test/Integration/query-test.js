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
});
