const Code = require('@hapi/code');
const Joi = require('@hapi/joi');
const Lab = require('@hapi/lab');

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

  lab.test('basic cache', async () => {
    let swaggerOptions = {
      cache: {
        expiresIn: 24 * 60 * 60 * 1000
      }
    };

    const server = await Helper.createServer(swaggerOptions, routes);
    await server.inject({ method: 'GET', url: '/swagger.json' });

    // double call to test '@hapi/code' paths as cache works
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('cache with generateTimeout', async () => {
    let swaggerOptions = {
      cache: {
        expiresIn: 24 * 60 * 60 * 1000,
        generateTimeout: 30 * 1000
      }
    };

    const server = await Helper.createServer(swaggerOptions, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });

    expect(response.statusCode).to.equal(200);
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('model cache using weakmap', async () => {
    // test if a joi object weakmap cache
    // the Joi object should only be parsed once

    let joiObj = Joi.object({
      a: Joi.number(),
      b: Joi.number(),
      operator: Joi.string(),
      equals: Joi.number()
    });

    const tempRoutes = [
      {
        method: 'POST',
        path: '/store1/',
        options: {
          handler: Helper.defaultHandler,
          tags: ['api'],
          validate: {
            payload: joiObj
          }
        }
      },
      {
        method: 'POST',
        path: '/store2/',
        options: {
          handler: Helper.defaultHandler,
          tags: ['api'],
          validate: {
            payload: joiObj
          }
        }
      }
    ];

    const server = await Helper.createServer({}, tempRoutes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });

    expect(response.statusCode).to.equal(200);
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });
});

lab.experiment('multiple plugins with cache', () => {
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

  lab.test('basic cache multiple apis', async () => {
    let swaggerOptions1 = {
      routeTag: 'store-api',
      info: {
        description: 'This is the store API docs',
      },
      cache: {
        expiresIn: 24 * 60 * 60 * 1000
      }
    };
    let swaggerOptions2 = {
      routeTag: 'shop-api',
      info: {
        description: 'This is the shop API docs',
      },
      cache: {
        expiresIn: 24 * 60 * 60 * 1000
      }
    };
    const server = await Helper.createServerMultiple(swaggerOptions1, swaggerOptions2, routes);

    await server.inject({ method: 'GET', url: '/store-api/swagger.json' });
    await server.inject({ method: 'GET', url: '/shop-api/swagger.json' });

    // double call to test '@hapi/code' paths as cache works
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
  });

});
