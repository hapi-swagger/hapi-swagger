'use strict';

const Code = require('@hapi/code');
const Joi = require('joi');
const Lab = require('@hapi/lab');
const Helper = require('../helper.js');
const Validate = require('../../lib/validate.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('child-models (OpenAPI)', () => {
  const requestOptions = {
    method: 'GET',
    url: '/openapi.json',
    headers: {
      host: 'localhost'
    }
  };

  const routes = [
    {
      method: 'POST',
      path: '/foo/v1/bar',
      options: {
        description: '...',
        tags: ['api'],
        validate: {
          payload: Joi.object({
            outer1: Joi.object({
              inner1: Joi.string()
            }),
            outer2: Joi.object({
              inner2: Joi.string()
            })
          })
        },
        handler: function () {}
      }
    },
    {
      path: '/bar/objects',
      method: 'POST',
      options: {
        handler: function () {},
        tags: ['api'],
        response: {
          schema: Joi.object()
            .keys({
              foos: Joi.object()
                .keys({
                  foo: Joi.string().description('some foo')
                })
                .label('FooObj')
            })
            .label('FooObjParent')
        },
        validate: {
          payload: Joi.object()
            .keys({
              foos: Joi.object()
                .keys({
                  foo: Joi.string().description('some foo')
                })
                .label('FooObj')
            })
            .label('FooObjParent')
        }
      }
    },
    {
      path: '/bar/arrays',
      method: 'POST',
      options: {
        handler: function () {},
        tags: ['api'],
        response: {
          schema: Joi.array()
            .items(
              Joi.array()
                .items(Joi.object({ bar: Joi.string() }).label('FooArrObj'))
                .label('FooArr')
            )
            .label('FooArrParent')
        },
        validate: {
          payload: Joi.array()
            .items(
              Joi.array()
                .items(Joi.object({ bar: Joi.string() }).label('FooArrObj'))
                .label('FooArr')
            )
            .label('FooArrParent')
        }
      }
    }
  ];

  lab.test('child definitions models', async () => {
    const server = await Helper.createServer({ OAS: 'v3.0' }, routes);
    const response = await server.inject(requestOptions);

    expect(response.statusCode).to.equal(200);

    expect(response.result.paths['/foo/v1/bar'].post.requestBody).to.equal({
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Model1'
          }
        }
      }
    });

    expect(response.result.components.schemas.Model1).to.equal({
      properties: {
        outer1: {
          $ref: '#/components/schemas/outer1'
        },
        outer2: {
          $ref: '#/components/schemas/outer2'
        }
      },
      type: 'object'
    });

    expect(response.result.components.schemas.outer1).to.equal({
      properties: {
        inner1: {
          type: 'string'
        }
      },
      type: 'object'
    });
    const isValid = await Validate.test(response.result);
    expect(isValid).to.be.true();
  });

  lab.test('object within an object - array within an array', async () => {
    const server = await Helper.createServer({ OAS: 'v3.0' }, routes);
    const response = await server.inject(requestOptions);

    expect(response.statusCode).to.equal(200);

    expect(response.result.paths['/bar/objects'].post.requestBody).to.equal({
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/FooObjParent'
          }
        }
      }
    });
    expect(response.result.paths['/bar/objects'].post.responses[200]).to.equal({
      description: 'Successful',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/FooObjParent'
          }
        }
      }
    });
    expect(response.result.components.schemas.FooObjParent).to.equal({
      type: 'object',
      properties: {
        foos: {
          $ref: '#/components/schemas/FooObj'
        }
      }
    });
    expect(response.result.components.schemas.FooObj).to.equal({
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          description: 'some foo'
        }
      }
    });

    expect(response.result.paths['/bar/arrays'].post.requestBody).to.equal({
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/FooArrParent'
          }
        }
      }
    });
    expect(response.result.paths['/bar/arrays'].post.responses[200]).to.equal({
      description: 'Successful',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/FooArrParent'
          }
        }
      }
    });
    expect(response.result.components.schemas.FooArrParent).to.equal({
      type: 'array',
      items: {
        $ref: '#/components/schemas/FooArr'
      }
    });
    expect(response.result.components.schemas.FooArr).to.equal({
      type: 'array',
      items: {
        $ref: '#/components/schemas/FooArrObj'
      }
    });
    expect(response.result.components.schemas.FooArrObj).to.equal({
      type: 'object',
      properties: {
        bar: {
          type: 'string'
        }
      }
    });
  });
});
