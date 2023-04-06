const Code = require('@hapi/code');
const Joi = require('joi');
const Lab = require('@hapi/lab');
const { clone } = require('@hapi/hoek');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('proxies', () => {
  const requestOptions = {
    method: 'GET',
    url: '/swagger.json',
    headers: {
      host: 'hostyhost:12345',
      referrer: 'http://localhost'
    }
  };

  const routes = {
    method: 'GET',
    path: '/test',
    handler: Helper.defaultHandler,
    options: {
      tags: ['api']
    }
  };

  lab.test('basePath option', async () => {
    const options = {
      basePath: '/v2'
    };

    const server = await Helper.createServer(options, routes);
    const response = await server.inject(requestOptions);
    expect(response.statusCode).to.equal(200);
    expect(response.result.basePath).to.equal(options.basePath);
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('schemes and host options', async () => {
    const options = {
      schemes: ['https'],
      host: 'testhost'
    };

    const server = await Helper.createServer(options, routes);
    const response = await server.inject(requestOptions);
    expect(response.result.host).to.equal(options.host);
    expect(response.result.schemes).to.equal(options.schemes);
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('referrer vs host and port', async () => {
    const options = {};

    const server = await Helper.createServer(options, routes);
    const response = await server.inject(requestOptions);
    expect(response.result.host).to.equal(new URL(requestOptions.headers.referrer).host);
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
    const clonedOptions = clone(requestOptions);
    delete clonedOptions.headers.referrer;
    const response2 = await server.inject(clonedOptions);
    expect(response2.result.host).to.equal(requestOptions.headers.host);
    expect(await Validate.test(response2.result)).to.be.true();
  });

  lab.test('x-forwarded options', async () => {
    const options = {};

    requestOptions.headers = {
      'x-forwarded-host': 'proxyhost',
      'x-forwarded-proto': 'https'
    };

    const server = await Helper.createServer(options, routes);
    const response = await server.inject(requestOptions);
    expect(response.result.host).to.equal(requestOptions.headers['x-forwarded-host']);
    expect(response.result.schemes).to.equal(['https']);
  });

  lab.test('x-forwarded options', async () => {
    const options = {};

    requestOptions.headers = {
      'x-forwarded-host': 'proxyhost',
      'x-forwarded-proto': 'https'
    };

    const server = await Helper.createServer(options, routes);
    const response = await server.inject(requestOptions);
    expect(response.result.host).to.equal(requestOptions.headers['x-forwarded-host']);
    expect(response.result.schemes).to.equal(['https']);
  });

  lab.test('multi-hop x-forwarded options', async () => {
    const options = {};

    requestOptions.headers = {
      'x-forwarded-host': 'proxyhost,internalproxy',
      'x-forwarded-proto': 'https,http'
    };

    const server = await Helper.createServer(options, routes);
    const response = await server.inject(requestOptions);
    expect(response.result.host).to.equal('proxyhost');
    expect(response.result.schemes).to.equal(['https']);
  });

  lab.test('Azure Web Sites options', async () => {
    const options = {};

    requestOptions.headers = {
      'x-arr-ssl': 'information about the SSL server certificate',
      'disguised-host': 'requested-host',
      host: 'internal-host'
    };

    const server = await Helper.createServer(options, routes);
    const response = await server.inject(requestOptions);
    expect(response.result.host).to.equal(requestOptions.headers['disguised-host']);
    expect(response.result.schemes).to.equal(['https']);
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('iisnode options', async () => {
    const serverOptions = {
      port: '\\\\.\\pipe\\GUID-expected-here'
    };

    const options = {};

    requestOptions.headers = {
      'disguised-host': 'requested-host',
      host: 'internal-host'
    };

    const server = await Helper.createServer(options, routes, serverOptions);
    const response = await server.inject(requestOptions);

    // Stop because otherwise consecutive test runs would error
    // with EADDRINUSE.
    await server.stop();

    expect(response.result.host).to.equal(requestOptions.headers['disguised-host']);
    expect(response.result.schemes).to.equal(['http']);
  });

  lab.test('adding facade for proxy using route options 1', async () => {
    const routes = {
      method: 'POST',
      path: '/tools/microformats/',
      options: {
        tags: ['api'],
        plugins: {
          '@timondev/hapi-swagger': {
            nickname: 'microformatsapi',
            validate: {
              payload: Joi.object({
                a: Joi.number().required().description('the first number'),
                b: Joi.number().required().description('the first number')
              }),
              query: Joi.object({
                testquery: Joi.string()
              }),
              params: Joi.object({
                testparam: Joi.string()
              }),
              headers: Joi.object({
                testheaders: Joi.string()
              })
            }
          }
        },
        handler: {
          proxy: {
            host: 'glennjones.net',
            protocol: 'http',
            onResponse: Helper.replyWithJSON
          }
        }
      }
    };

    const server = await Helper.createServer({}, routes);
    const response = await server.inject(requestOptions);

    expect(response.result.paths['/tools/microformats/'].post.parameters).to.equal([
      {
        type: 'string',
        in: 'header',
        name: 'testheaders'
      },
      {
        type: 'string',
        in: 'path',
        name: 'testparam'
      },
      {
        type: 'string',
        in: 'query',
        name: 'testquery'
      },
      {
        in: 'body',
        name: 'body',
        schema: {
          $ref: '#/definitions/Model1'
        }
      }
    ]);
  });

  lab.test('adding facade for proxy using route options 2 - naming', async () => {
    const routes = {
      method: 'POST',
      path: '/tools/microformats/',
      options: {
        tags: ['api'],
        plugins: {
          '@timondev/hapi-swagger': {
            id: 'microformatsapi',
            validate: {
              payload: Joi.object({
                a: Joi.number().required().description('the first number')
              }).label('testname')
            }
          }
        },
        handler: {
          proxy: {
            host: 'glennjones.net',
            protocol: 'http',
            onResponse: Helper.replyWithJSON
          }
        }
      }
    };

    const server = await Helper.createServer({}, routes);
    const response = await server.inject(requestOptions);

    expect(response.result.paths['/tools/microformats/'].post.parameters).to.equal([
      {
        in: 'body',
        name: 'body',
        schema: {
          $ref: '#/definitions/testname'
        }
      }
    ]);
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('adding facade for proxy using route options 3 - defination reuse', async () => {
    const routes = [
      {
        method: 'POST',
        path: '/tools/microformats/1',
        options: {
          tags: ['api'],
          plugins: {
            '@timondev/hapi-swagger': {
              id: 'microformatsapi1',
              validate: {
                payload: Joi.object({
                  a: Joi.number().required().description('the first number')
                }).label('testname')
              }
            }
          },
          handler: {
            proxy: {
              host: 'glennjones.net',
              protocol: 'http',
              onResponse: Helper.replyWithJSON
            }
          }
        }
      },
      {
        method: 'POST',
        path: '/tools/microformats/2',
        options: {
          tags: ['api'],
          plugins: {
            '@timondev/hapi-swagger': {
              id: 'microformatsapi2',
              validate: {
                payload: Joi.object({
                  a: Joi.number().required().description('the first number')
                }).label('testname')
              }
            }
          },
          handler: {
            proxy: {
              host: 'glennjones.net',
              protocol: 'http',
              onResponse: Helper.replyWithJSON
            }
          }
        }
      }
    ];

    const server = await Helper.createServer({}, routes);
    const response = await server.inject(requestOptions);

    expect(response.result.definitions).to.equal({
      testname: {
        properties: {
          a: {
            type: 'number',
            description: 'the first number'
          }
        },
        required: ['a'],
        type: 'object'
      }
    });
  });

  lab.test('adding facade for proxy using route options 4 - defination name clash', async () => {
    const routes = [
      {
        method: 'POST',
        path: '/tools/microformats/1',
        options: {
          tags: ['api'],
          plugins: {
            '@timondev/hapi-swagger': {
              id: 'microformatsapi1',
              validate: {
                payload: Joi.object({
                  a: Joi.number().required().description('the first number')
                }).label('testname')
              }
            }
          },
          handler: {
            proxy: {
              host: 'glennjones.net',
              protocol: 'http',
              onResponse: Helper.replyWithJSON
            }
          }
        }
      },
      {
        method: 'POST',
        path: '/tools/microformats/2',
        options: {
          tags: ['api'],
          plugins: {
            '@timondev/hapi-swagger': {
              id: 'microformatsapi2',
              validate: {
                payload: Joi.object({
                  b: Joi.string().description('the string')
                }).label('testname')
              }
            }
          },
          handler: {
            proxy: {
              host: 'glennjones.net',
              protocol: 'http',
              onResponse: Helper.replyWithJSON
            }
          }
        }
      }
    ];

    const server = await Helper.createServer({}, routes);
    const response = await server.inject(requestOptions);
    expect(response.result.definitions).to.equal({
      testname: {
        properties: {
          a: {
            type: 'number',
            description: 'the first number'
          }
        },
        required: ['a'],
        type: 'object'
      },
      Model1: {
        properties: {
          b: {
            type: 'string',
            description: 'the string'
          }
        },
        type: 'object'
      }
    });
  });
});
