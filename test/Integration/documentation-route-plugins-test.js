const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('documentation-route-plugins', () => {
  const routes = [
    {
      method: 'GET',
      path: '/test',
      handler: Helper.defaultHandler
    }
  ];

  const testServer = async (swaggerOptions, plugins) => {
    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });

    const table = server.table();
    table.forEach(route => {
      switch (route.path) {
        case '/test':
          break;
        case '/documentation':
          expect(route.settings.plugins).to.equal(plugins);
          break;
        case '/swagger.json':
          expect(route.settings.plugins).to.equal({ 'hapi-swagger': false });
          break;
        case '/swaggerui/extend.js':
        case '/swaggerui/{path*}':
          expect(route.settings.plugins).to.equal({});
          break;
        default:
          break;
      }
    });

    expect(response.statusCode).to.equal(200);
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  };

  lab.test('should have no documentationRoutePlugins property', async () => {
    await testServer({}, {});
  });

  lab.test('should have documentationRoutePlugins property passed', async () => {
    const swaggerOptions = {
      documentationRoutePlugins: {
        blankie: {
          fontSrc: ['self', 'fonts.gstatic.com', 'data:']
        }
      }
    };
    await testServer(swaggerOptions, swaggerOptions.documentationRoutePlugins);
  });

  lab.test('should have multiple documentationRoutePlugins options', async () => {
    const swaggerOptions = {
      documentationRoutePlugins: {
        blankie: {
          fontSrc: ['self', 'fonts.gstatic.com', 'data:']
        },
        'simple-plugin': {
          isEnable: true
        }
      }
    };
    await testServer(swaggerOptions, swaggerOptions.documentationRoutePlugins);
  });
});
