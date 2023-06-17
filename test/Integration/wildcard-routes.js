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
    lab.experiment('wildcard routes', () => {
      lab.test('method *', async () => {
        const routes = {
          method: '*',
          path: '/test',
          handler: Helper.defaultHandler,
          options: {
            tags: ['api'],
            notes: 'test'
          }
        };

        const server = await Helper.createServer({ OAS: version }, routes);
        const response = await server.inject({ method: 'GET', url: jsonUrl });

        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test']).to.have.length(5);
        expect(response.result.paths['/test']).to.include('get');
        expect(response.result.paths['/test']).to.include('post');
        expect(response.result.paths['/test']).to.include('put');
        expect(response.result.paths['/test']).to.include('patch');
        expect(response.result.paths['/test']).to.include('delete');
      });

      lab.test('method * with custom methods', async () => {
        const routes = {
          method: '*',
          path: '/test',
          handler: Helper.defaultHandler,
          options: {
            tags: ['api'],
            notes: 'test'
          }
        };

        const server = await Helper.createServer({ OAS: version, wildcardMethods: ['GET', 'QUERY'] }, routes);
        const response = await server.inject({ method: 'GET', url: jsonUrl });

        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test']).to.have.length(2);
        expect(response.result.paths['/test']).to.include('get');
        expect(response.result.paths['/test']).to.include('query');
      });

      lab.test('method * with not allowed custom methods', async () => {
        try {
          const routes = {
            method: '*',
            path: '/test',
            handler: Helper.defaultHandler,
            options: {
              tags: ['api'],
              notes: 'test'
            }
          };

          await Helper.createServer({ OAS: version, wildcardMethods: ['HEAD', 'OPTIONS'] }, routes);
        } catch (err) {
          expect(err).to.exists();
          expect(err.message).include('wildcardMethods');
        }
      });

      lab.test('method array [GET, POST]', async () => {
        const routes = {
          method: ['GET', 'POST'],
          path: '/test',
          handler: Helper.defaultHandler,
          options: {
            tags: ['api'],
            notes: 'test'
          }
        };

        const server = await Helper.createServer({ OAS: version }, routes);
        const response = await server.inject({ method: 'GET', url: jsonUrl });

        expect(response.statusCode).to.equal(200);
        expect(response.result.paths['/test']).to.have.length(2);
        expect(response.result.paths['/test']).to.include('get');
        expect(response.result.paths['/test']).to.include('post');
        const isValid = await Validate.test(response.result);
        expect(isValid).to.be.true();
      });
    });
  });
});
