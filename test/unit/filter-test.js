const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helper = require('../helper.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('filter', () => {
  const routes = [
    {
      method: 'GET',
      path: '/no-tags',
      options: {
        handler: Helper.defaultHandler
      }
    },
    {
      method: 'GET',
      path: '/api-alpha-tag',
      options: {
        tags: ['api', 'alpha'],
        handler: Helper.defaultHandler
      }
    },
    {
      method: 'GET',
      path: '/api-beta-tag',
      options: {
        tags: ['api', 'beta'],
        handler: Helper.defaultHandler
      }
    },
    {
      method: 'GET',
      path: '/beta-tag',
      options: {
        tags: ['beta'],
        handler: Helper.defaultHandler
      }
    },
    {
      method: 'GET',
      path: '/api-alpha-gamma-tag',
      options: {
        tags: ['api', 'alpha', 'gamma'],
        handler: Helper.defaultHandler
      }
    }
  ];

  lab.test('by `api` tag by default', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(Object.keys(response.result.paths).length).to.equal(3);
    expect(response.result.paths['/api-beta-tag']).to.exist();
    expect(response.result.paths['/api-alpha-tag']).to.exist();
    expect(response.result.paths['/api-alpha-gamma-tag']).to.exist();
  });

  lab.test('Query string params (alpha OR gamma), then by `routeTag` (api)', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json?tags=alpha,gamma' });
    expect(Object.keys(response.result.paths).length).to.equal(2);
    expect(response.result.paths['/api-alpha-tag']).to.exist();
    expect(response.result.paths['/api-alpha-gamma-tag']).to.exist();
  });

  lab.test('Query string params (beta), then by `routeTag` (function)', async () => {
    const server = await Helper.createServer({ routeTag: (tags) => !tags.includes('api') }, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json?tags=beta' });
    expect(Object.keys(response.result.paths).length).to.equal(1);
    expect(response.result.paths['/beta-tag']).to.exist();
  });

  lab.test('Query string params (alpha OR beta) AND api, then by `routeTag` (api)', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({
      method: 'GET',
      url: `/swagger.json?tags=alpha,beta,${encodeURIComponent('+')}api`
    });
    expect(Object.keys(response.result.paths).length).to.equal(3);
    expect(response.result.paths['/api-alpha-tag']).to.exist();
    expect(response.result.paths['/api-beta-tag']).to.exist();
    expect(response.result.paths['/api-alpha-gamma-tag']).to.exist();
  });

  lab.test('Query string params (alpha AND gamma), then by `routeTag` (api)', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({
      method: 'GET',
      url: `/swagger.json?tags=alpha,${encodeURIComponent('+')}gamma`
    });
    expect(Object.keys(response.result.paths).length).to.equal(1);
    expect(response.result.paths['/api-alpha-gamma-tag']).to.exist();
  });

  lab.test('Query string params (alpha AND NOT gamma), then by `routeTag` (api)', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json?tags=alpha,-gamma' });
    expect(Object.keys(response.result.paths).length).to.equal(1);
    expect(response.result.paths['/api-alpha-tag']).to.exist();
  });

  lab.test('by `routeTag` string if set', async () => {
    const server = await Helper.createServer({ routeTag: 'beta' }, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(Object.keys(response.result.paths).length).to.equal(2);
    expect(response.result.paths['/api-beta-tag']).to.exist();
    expect(response.result.paths['/beta-tag']).to.exist();
  });

  lab.test('by `routeTag` function if set', async () => {
    const server = await Helper.createServer(
      { routeTag: (tags) => tags.includes('api') && tags.includes('beta') },
      routes
    );
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(Object.keys(response.result.paths).length).to.equal(1);
    expect(response.result.paths['/api-beta-tag']).to.exist();
  });

  lab.test('picks all routes if `routeTag` is set to () => true', async () => {
    const server = await Helper.createServer({ routeTag: () => true }, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(Object.keys(response.result.paths).length).to.equal(routes.length);
    const documentedRoutes = Object.keys(response.result.paths);
    expect(documentedRoutes.some(route => route.includes('swagger'))).to.false();
  });

  lab.test('picks all routes if `routeTag` is set to () => true, when jsonPath is not default', async () => {
    const jsonPath = '/testPath/swagger-test.json';
    const server = await Helper.createServer({
      jsonPath,
      routeTag: () => true
    }, routes);
    const response = await server.inject({ method: 'GET', url: jsonPath });
    expect(response.statusCode).to.equal(200);
    expect(Object.keys(response.result.paths).length).to.equal(routes.length);
    const documentedRoutes = Object.keys(response.result.paths);
    expect(documentedRoutes.some(route => route.includes('swagger'))).to.false();
  });

  lab.test('picks all routes if `routeTag` is set to () => true, when swaggerUIPath is not default', async () => {
    const swaggerUIPath = '/testPath';
    const server = await Helper.createServer({
      swaggerUIPath,
      routeTag: () => true
    }, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(Object.keys(response.result.paths).length).to.equal(routes.length);
    const documentedRoutes = Object.keys(response.result.paths);
    expect(documentedRoutes.some(route => route.includes('swagger'))).to.false();
  });
});
