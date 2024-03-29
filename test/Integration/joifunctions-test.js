const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('validation', () => {
  const routes = {
    method: 'POST',
    path: '/test',
    handler: Helper.defaultHandler,
    options: {
      description: 'Add sum',
      notes: ['Adds a sum to the data store'],
      tags: ['api'],
      validate: {
        payload: (value) => {
          console.log('testing');
          return value;
        },
        // params: async (value) => {

        //     console.log('testing');
        //     return value;
        // },
        query: (value) => {
          console.log('testing');
          return value;
        },
        headers: (value) => {
          console.log('testing');
          return value;
        }
      }
    }
  };

  lab.test('function not joi', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths['/test'].post.parameters).to.equal([
      {
        type: 'string',
        name: 'Hidden Model',
        in: 'header'
      },
      {
        type: 'string',
        name: 'Hidden Model',
        in: 'query'
      },
      {
        in: 'body',
        name: 'body',
        schema: {
          $ref: '#/definitions/Hidden%20Model'
        }
      }
    ]);
    expect(response.result.definitions).to.equal({
      'Hidden Model': {
        type: 'object'
      }
    });
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });
});
