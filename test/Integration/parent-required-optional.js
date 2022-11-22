const Code = require('@hapi/code');
const Joi = require('joi');
const Lab = require('@hapi/lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('path', () => {
  const requiredChildSchema = Joi.object({
    p1: Joi.string()
  }).required();

  const responseBodySchema = Joi.object({
    requiredChild: requiredChildSchema
  }).label('Response');

  const requestBodySchema = Joi.object({
    requiredChild: requiredChildSchema,
    optionalChild: requiredChildSchema.optional()
  }).label('Request');

  const routes = {
    method: 'POST',
    path: '/test',
    handler: Helper.defaultHandler,
    options: {
      description: 'Required should appear on response and request',
      notes: ['Testing'],
      tags: ['api'],
      validate: {
        payload: requestBodySchema
      },
      response: {
        schema: responseBodySchema
      }
    }
  };

  lab.test('parent required should include required children', async () => {
    // we need to set reuseDefinitions to false here otherwise,
    // Request would be reused for Response as they're too similar
    const server = await Helper.createServer({ reuseDefinitions: false }, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.result.definitions.Request.required).to.equal(['requiredChild']);
    expect(response.result.definitions.Response.required).to.equal(['requiredChild']);
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });
});
