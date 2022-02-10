const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Inert = require('@hapi/inert');
const Joi = require('joi');
const Lab = require('@hapi/lab');
const Vision = require('@hapi/vision');
const { resolve } = require('path');
const HapiSwagger = require('../../lib/index.js');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('plugin', () => {
  const routes = [
    {
      method: 'POST',
      path: '/store/',
      options: {
        handler: Helper.defaultHandler,
        tags: ['api'],
        validate: {
          payload: Joi.object({
            a: Joi.number(),
            b: Joi.number(),
            operator: Joi.string(),
            equals: Joi.number()
          })
        }
      }
    }
  ];

  lab.test('plug-in register no vision dependency', async () => {
    try {
      const server = new Hapi.Server();
      await server.register([Inert, HapiSwagger]);
      server.route(routes);
      await server.start();
    } catch (err) {
      expect(err.message).to.equal('Plugin hapi-swagger missing dependency @hapi/vision');
    }
  });

  lab.test('plug-in register no inert dependency', async () => {
    try {
      const server = new Hapi.Server();
      await server.register([Vision, HapiSwagger]);
      server.route(routes);
      await server.start();
    } catch (err) {
      expect(err.message).to.equal('Plugin hapi-swagger missing dependency @hapi/inert');
    }
  });

  lab.test('plug-in register no options', async () => {
    try {
      const server = new Hapi.Server();
      await server.register([Inert, Vision, HapiSwagger]);
      server.route(routes);
      await server.start();
      expect(server).to.be.an.object();
    } catch (err) {
      expect(err).to.equal(undefined);
    }
  });

  lab.test('fail plug-in register with bad options', async () => {
    const badOptions = {
      validate: 42
    };
    try {
      await Helper.createServer(badOptions, routes);
    } catch (err) {
      expect(err).to.exist();
      expect(err.name).to.equal('ValidationError');
      expect(err.details).to.have.length(1)
      expect(err.details[0].message).to.equal('"validate" must be of type object')
    }
  });

  lab.test('plug-in register test', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths).to.have.length(1);
  });

  lab.test('plug-in register with validate option', async () => {
    const goodOptions = {
      validate: {
        headers: true
      }
    };
    const server = await Helper.createServer(goodOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths).to.have.length(1);
  });

  lab.test('plug-in register with server validation options', async () => {
    const serverOptions = {
      routes: {
        validate: {
          failAction: (request, h, err) => {
            Hoek.ignore(request, h)
            throw err
          },
          headers: Joi.object({
            authorization: Joi.string().required()
          })
            .required()
        }
      }
    };
    const server = await Helper.createServer(undefined, routes, serverOptions);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(400);
    expect(response.statusMessage).to.equal('Bad Request');
    expect(response.result.statusCode).to.equal(400);
    expect(response.result.error).to.equal('Bad Request');
    expect(response.result.message).to.equal('"authorization" is required');
  });

  lab.test('plug-in register and overrride server validation options', async () => {
    const serverOptions = {
      routes: {
        validate: {
          failAction: (request, h, err) => {
            Hoek.ignore(request, h)
            throw err
          },
          headers: Joi.object({
            authorization: Joi.string().required()
          })
            .required()
        }
      }
    };
    const pluginOptions = {
      validate: {
        headers: true
      }
    }
    const server = await Helper.createServer(pluginOptions, routes, serverOptions);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths).to.have.length(1);
  });

  lab.test('default jsonPath url', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
  });

  lab.test('default documentationPath url', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({ method: 'GET', url: '/documentation' });
    expect(response.statusCode).to.equal(200);
  });

  lab.test('default swaggerUIPath url', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({ method: 'GET', url: '/swaggerui/swagger-ui.js' });
    expect(response.statusCode).to.equal(200);
  });

  lab.test('swaggerUIPath + extend.js remapping', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({ method: 'GET', url: '/swaggerui/extend.js' });
    expect(response.statusCode).to.equal(200);
  });

  const swaggerOptions = {
    jsonPath: '/test.json',
    documentationPath: '/testdoc',
    swaggerUIPath: '/testui/'
  };

  lab.test('repathed jsonPath url', async () => {
    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/test.json' });
    expect(response.statusCode).to.equal(200);
  });

  lab.test('repathed jsonPath url and jsonRoutePath', async () => {
    const jsonRoutePath = '/testRoute/test.json';

    const server = await Helper.createServer(
      {
        ...swaggerOptions,
        jsonRoutePath
      },
      routes
    );

    const notFoundResponse = await server.inject({ method: 'GET', url: '/test.json' });

    expect(notFoundResponse.statusCode).to.equal(404);

    const okResponse = await server.inject({ method: 'GET', url: jsonRoutePath });

    expect(okResponse.statusCode).to.equal(200);
  });

  lab.test('repathed documentationPath url', async () => {
    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/testdoc' });
    expect(response.statusCode).to.equal(200);
  });

  lab.test('repathed assets url', async () => {
    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/testdoc' });

    expect(response.statusCode).to.equal(200);

    const assets = Helper.getAssetsPaths(response.result);

    assets.forEach(asset => {
      expect(asset).to.contain(swaggerOptions.swaggerUIPath);
    });

    const responses = await Promise.all(
      assets.map(asset => {
        return server.inject({ method: 'GET', url: asset });
      })
    );

    responses.forEach(assetResponse => {
      expect(assetResponse.statusCode).to.equal(200);
    });
  });

  lab.test('repathed assets url and reoutes path', async () => {
    const routesBasePath = '/testRoute/';
    const server = await Helper.createServer(
      {
        ...swaggerOptions,
        routesBasePath
      },
      routes
    );
    const response = await server.inject({ method: 'GET', url: '/testdoc' });

    expect(response.statusCode).to.equal(200);

    const assets = Helper.getAssetsPaths(response.result);

    assets.forEach(asset => {
      expect(asset).to.contain(swaggerOptions.swaggerUIPath);
    });

    const notFoundResponses = await Promise.all(
      assets.map(asset => {
        return server.inject({ method: 'GET', url: asset });
      })
    );

    notFoundResponses.forEach(assetResponse => {
      expect(assetResponse.statusCode).to.equal(404);
    });

    const okResponses = await Promise.all(
      assets.map(asset => {
        return server.inject({ method: 'GET', url: asset.replace(swaggerOptions.swaggerUIPath, routesBasePath) });
      })
    );

    okResponses.forEach(assetResponse => {
      expect(assetResponse.statusCode).to.equal(200);
    });
  });

  lab.test('disable documentation path', async () => {
    const swaggerOptions = {
      documentationPage: false
    };

    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/documentation' });
    expect(response.statusCode).to.equal(404);
  });

  lab.test('disable swagger UI', async () => {
    const swaggerOptions = {
      swaggerUI: false,
      documentationPage: false
    };

    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/swaggerui/swagger-ui.js' });
    expect(response.statusCode).to.equal(404);
  });

  lab.test('disable swagger UI overridden by documentationPage', async () => {
    const swaggerOptions = {
      swaggerUI: false,
      documentationPage: true
    };

    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/swaggerui/swagger-ui.js' });
    expect(response.statusCode).to.equal(200);
  });

  lab.test('should take the plugin route prefix into account when rendering the UI', async () => {
    const server = new Hapi.Server();
    await server.register([
      Inert,
      Vision,
      {
        plugin: HapiSwagger,
        routes: {
          prefix: '/implicitPrefix'
        },
        options: {}
      }
    ]);

    server.route(routes);
    await server.start();
    const response = await server.inject({ method: 'GET', url: '/implicitPrefix/documentation' });
    expect(response.statusCode).to.equal(200);
    const htmlContent = response.result;
    expect(htmlContent).to.contain(['/implicitPrefix/swaggerui/swagger-ui-bundle.js', '/implicitPrefix/swagger.json']);
  });

  lab.test('should use templates options to render ui', async () => {
    const server = new Hapi.Server();
    await server.register([
      Inert,
      Vision,
      {
        plugin: HapiSwagger,
        options: {
          templates: resolve(__dirname, 'templates')
        }
      }
    ]);

    server.route(routes);
    await server.start();
    const response = await server.inject({ method: 'GET', url: '/documentation' });
    expect(response.statusCode).to.equal(200);
    const htmlContent = response.result;
    expect(htmlContent).to.contain(['swagger-ui-userland']);
  });

  lab.test('enable cors settings, should return headers with origin settings', async () => {
    const swaggerOptions = {
      cors: true
    };

    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });

    expect(response.statusCode).to.equal(200);
    // https://stackoverflow.com/questions/25329405/why-isnt-vary-origin-response-set-on-a-cors-miss
    expect(response.headers.vary).to.equal('origin');
    expect(response.result.paths['/store/'].post.parameters.length).to.equal(1);
    expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('body');
  });

  lab.test('disable cors settings, should return headers without origin settings', async () => {
    const swaggerOptions = {
      cors: false
    };

    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.headers.vary).to.not.equal('origin');
    expect(response.result.paths['/store/'].post.parameters.length).to.equal(1);
    expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('body');
  });

  lab.test('default cors settings as false, should return headers without origin settings', async () => {
    const swaggerOptions = {};

    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.headers.vary).to.not.equal('origin,accept-encoding');
    expect(response.result.paths['/store/'].post.parameters.length).to.equal(1);
    expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('body');
  });

  lab.test('payloadType = form global', async () => {
    const swaggerOptions = {
      payloadType: 'json'
    };

    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths['/store/'].post.parameters.length).to.equal(1);
    expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('body');
  });

  lab.test('payloadType = json global', async () => {
    const swaggerOptions = {
      payloadType: 'form'
    };

    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths['/store/'].post.parameters.length).to.equal(4);
    expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('a');
  });

  lab.test('pathPrefixSize global', async () => {
    const swaggerOptions = {
      pathPrefixSize: 2
    };

    const prefixRoutes = [
      {
        method: 'GET',
        path: '/foo/bar/extra',
        options: {
          handler: Helper.defaultHandler,
          tags: ['api']
        }
      }
    ];

    const server = await Helper.createServer(swaggerOptions, prefixRoutes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.paths['/foo/bar/extra'].get.tags[0]).to.equal('foo/bar');
  });

  lab.test('expanded none', async () => {
    // TODO find a way to test impact of property change
    const server = await Helper.createServer({ expanded: 'none' });
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
  });

  lab.test('expanded list', async () => {
    const server = await Helper.createServer({ expanded: 'list' });
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
  });

  lab.test('expanded full', async () => {
    const server = await Helper.createServer({ expanded: 'full' }, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
  });

  lab.test('pass through of tags querystring', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({ method: 'GET', url: '/documentation?tags=reduced' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.indexOf('swagger.json?tags=reduced') > -1).to.equal(true);
  });

  lab.test('tryItOutEnabled true', async () => {
    const server = await Helper.createServer({ tryItOutEnabled: true });
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
  });

  lab.test('tryItOutEnabled false', async () => {
    const server = await Helper.createServer({ tryItOutEnabled: false });
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
  });

  lab.test('test route x-meta appears in swagger', async () => {
    const testRoutes = [
      {
        method: 'POST',
        path: '/test/',
        options: {
          handler: Helper.defaultHandler,
          tags: ['api'],
          plugins: {
            'hapi-swagger': {
              'x-meta': {
                test1: true,
                test2: 'test',
                test3: {
                  test: true
                }
              }
            }
          }
        }
      }
    ];
    const server = await Helper.createServer({}, testRoutes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.result.paths['/test/'].post['x-meta']).to.equal({
      test1: true,
      test2: 'test',
      test3: {
        test: true
      }
    });
  });

  lab.test('test arbitrary vendor extensions (x-*) appears in swagger', async () => {
    const testRoutes = [
      {
        method: 'POST',
        path: '/test/',
        options: {
          handler: Helper.defaultHandler,
          tags: ['api'],
          plugins: {
            'hapi-swagger': {
              'x-code-samples': {
                lang: 'JavaScript',
                source: 'console.log("Hello World");'
              },
              'x-custom-string': 'some string'
            }
          }
        }
      }
    ];
    const server = await Helper.createServer({}, testRoutes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.result.paths['/test/'].post['x-code-samples']).to.equal({
      lang: 'JavaScript',
      source: 'console.log("Hello World");'
    });
    expect(response.result.paths['/test/'].post['x-custom-string']).to.equal('some string');
  });

  lab.test('test {disableDropdown: true} in swagger', async () => {
    const testRoutes = [
      {
        method: 'POST',
        path: '/test/',
        options: {
          handler: Helper.defaultHandler,
          tags: ['api'],
          validate: {
            payload: Joi.object({
              a: Joi.number()
                .integer()
                .allow(0)
                .meta({ disableDropdown: true })
            })
          }
        }
      }
    ];
    const server = await Helper.createServer({}, testRoutes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });

    expect(response.result.definitions).to.equal({
      Model1: {
        type: 'object',
        properties: {
          a: {
            type: 'integer',
            'x-meta': {
              disableDropdown: true
            }
          }
        }
      }
    });
  });
});

lab.experiment('multiple plugins', () => {
  const routes = [
    {
      method: 'POST',
      path: '/store/',
      options: {
        handler: Helper.defaultHandler,
        tags: ['store-api'],
        validate: {
          payload: Joi.object({
            a: Joi.number(),
            b: Joi.number(),
            operator: Joi.string(),
            equals: Joi.number()
          })
        }
      }
    },
    {
      method: 'POST',
      path: '/shop/',
      options: {
        handler: Helper.defaultHandler,
        tags: ['shop-api'],
        validate: {
          payload: Joi.object({
            c: Joi.number(),
            d: Joi.number(),
            operator: Joi.string(),
            equals: Joi.number()
          })
        }
      }
    }
  ];

  lab.test('multiple plugins can co-exist', async () => {
    const swaggerOptions1 = {
      routeTag: 'store-api',
      info: {
        description: 'This is the store API docs'
      }
    };
    const swaggerOptions2 = {
      routeTag: 'shop-api',
      info: {
        description: 'This is the shop API docs'
      }
    };
    const server = await Helper.createServerMultiple(swaggerOptions1, swaggerOptions2, routes);

    const response1 = await server.inject({ method: 'GET', url: '/store-api/swagger.json' });
    expect(response1.statusCode).to.equal(200);
    const isValid1 = await Validate.test(response1.result);
    expect(isValid1).to.be.true();
    expect(response1.result.info.description).to.equal('This is the store API docs');
    expect(response1.result.paths['/store/'].post.operationId).to.equal('postStore');

    const response2 = await server.inject({ method: 'GET', url: '/shop-api/swagger.json' });
    expect(response2.statusCode).to.equal(200);
    const isValid2 = await Validate.test(response2.result);
    expect(isValid2).to.be.true();
    expect(response2.result.info.description).to.equal('This is the shop API docs');
    expect(response2.result.paths['/shop/'].post.operationId).to.equal('postShop');

    const document1 = await server.inject({ method: 'GET', url: '/store-api/documentation' });
    expect(document1.statusCode).to.equal(200);
    expect(document1.result).to.include('/store-api/');
    expect(document1.result).not.to.include('/shop-api/');

    const document2 = await server.inject({ method: 'GET', url: '/shop-api/documentation' });
    expect(document2.statusCode).to.equal(200);
    expect(document2.result).to.include('/shop-api/');
    expect(document2.result).not.to.include('/store-api/');
  });
});
