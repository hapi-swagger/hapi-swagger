const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

const versions = ['v2', 'v3.0'];
versions.forEach((version) => {
  const jsonUrl = version === 'v2' ? '/swagger.json' : '/openapi.json';

  lab.experiment(`OAS ${version}`, () => {
    lab.experiment('tags', () => {
      const routes = [
        {
          method: 'GET',
          path: '/test',
          handler: Helper.defaultHandler,
          options: {
            tags: ['api']
          }
        }
      ];

      lab.test('no tag objects passed', async () => {
        const server = await Helper.createServer({ OAS: version }, routes);
        const response = await server.inject({ method: 'GET', url: jsonUrl });
        expect(response.statusCode).to.equal(200);
        expect(response.result.tags).to.equal([]);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
      });

      lab.test('name property passed', async () => {
        const swaggerOptions = {
          OAS: version,
          tags: [
            {
              name: 'test'
            }
          ]
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: jsonUrl });
        expect(response.statusCode).to.equal(200);
        expect(response.result.tags[0].name).to.equal('test');

        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
      });

      lab.test('full tag object', async () => {
        const swaggerOptions = {
          OAS: version,
          tags: [
            {
              name: 'test',
              description: 'Everything about test',
              externalDocs: {
                description: 'Find out more',
                url: 'http://swagger.io'
              }
            }
          ]
        };

        const server = await Helper.createServer(swaggerOptions, routes);
        const response = await server.inject({ method: 'GET', url: jsonUrl });

        expect(response.statusCode).to.equal(200);
        expect(response.result.tags).to.equal(swaggerOptions.tags);
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
      });
    });
  });
});
