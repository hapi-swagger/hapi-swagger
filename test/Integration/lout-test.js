const Code = require('@hapi/code');
const Joi = require('@hapi/joi');
const Lab = require('@hapi/lab');
const Helper = require('../helper.js');

const expect = Code.expect;
const lab = (exports.lab = Lab.script());

lab.experiment('lout examples', () => {
  // these are example are taken from https://github.com/hapijs/lout/blob/master/test/routes/default.js
  /*
    Copyright (c) 2012-2014, Walmart and other contributors.
    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:
        * Redistributions of source '@hapi/code' must retain the above copyright
        notice, this list of conditions and the following disclaimer.
        * Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.
        * The names of any contributors may not be used to endorse or promote
        products derived from this software without specific prior written
        permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
    ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS AND CONTRIBUTORS BE LIABLE FOR ANY
    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    */
  const routes = [
    {
      method: 'GET',
      path: '/test',
      options: {
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.string()
              .insensitive()
              .required()
          })
        },
        tags: ['api'],
        description: 'Test GET',
        notes: 'test note'
      }
    },
    {
      method: 'GET',
      path: '/another/test',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.string().required()
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/zanother/test',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.string().required()
          })
        }
      }
    },
    {
      method: 'POST',
      path: '/test',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param2: Joi.string().valid('first', 'last'),
            param3: 'third',
            param4: 42
          })
        }
      }
    },
    {
      method: 'DELETE',
      path: '/test',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param2: Joi.string().valid('first', 'last')
          })
        }
      }
    },
    {
      method: 'PUT',
      path: '/test',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param2: Joi.string().valid('first', 'last')
          })
        }
      }
    },
    {
      method: 'PATCH',
      path: '/test',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param2: Joi.string().valid('first', 'last'),
            param3: Joi.number().valid(42)
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/notincluded',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        plugins: {
          lout: false
        }
      }
    },
    {
      method: 'GET',
      path: '/nested',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.object({
              nestedparam1: Joi.string().required(),
              array: Joi.array()
            })
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/rootobject',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.string().required()
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/rootarray',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.array()
            .items(Joi.string().required(), Joi.object({ param1: Joi.number() }), Joi.number().forbidden())
            .min(2)
            .max(5)
            .length(3)
        }
      }
    },
    {
      method: 'GET',
      path: '/complexarray',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.array()
            .ordered('foo', 'bar')
            .items(
              Joi.string().required(),
              Joi.string()
                .valid('four')
                .forbidden(),
              Joi.object({ param1: Joi.number() }),
              Joi.number().forbidden()
            )
            .min(2)
            .max(5)
            .length(3)
            .ordered('bar', 'bar')
            .items(Joi.number().required())
        }
      }
    },
    {
      method: 'GET',
      path: '/path/{pparam}/test',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          params: Joi.object({
            pparam: Joi.string().required()
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/emptyobject',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.object()
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/alternatives',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.alternatives().try(Joi.number().required(), Joi.string().valid('first', 'last'))
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withnestedalternatives',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.object({
              param2: Joi.alternatives().try(
                {
                  param3: Joi.object({
                    param4: Joi.number().example(5)
                  }).description('this is cool too')
                },
                Joi.number().min(42)
              )
            }).description('something really cool'),
            param2: Joi.array()
              .items(
                Joi.object({
                  param2: Joi.alternatives().try(
                    {
                      param3: Joi.object({
                        param4: Joi.number().example(5)
                      }).description('this is cool too')
                    },
                    Joi.array().items('foo', 'bar'),
                    Joi.number()
                      .min(42)
                      .required(),
                    Joi.number()
                      .max(42)
                      .required()
                  )
                }).description('all the way down')
              )
              .description('something really cool')
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/novalidation',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler
      }
    },
    {
      method: 'GET',
      path: '/withresponse',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        response: {
          schema: Joi.object({
            param1: Joi.string()
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withstatus',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        response: {
          schema: Joi.object({
            param1: Joi.string()
          }),
          //TODO: fix this?
          status: {
            204: Joi.object({
              param2: Joi.string()
            }),
            404: Joi.object({
              error: 'Failure'
            })
          }
        }
      }
    },
    {
      method: 'GET',
      path: '/withpojoinarray',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.array().items({
              param2: Joi.string()
            })
          })
        }
      }
    },
    {
      method: 'POST',
      path: '/withnestedrulesarray',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          payload: Joi.object({
            param1: Joi.array().items(
              Joi.object({
                param2: Joi.array()
                  .items(
                    Joi.object({
                      param3: Joi.string()
                    })
                  )
                  .optional()
              })
            )
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withhtmlnote',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.string().note('<span class="htmltypenote">HTML type note</span>')
          })
        },
        notes: '<span class="htmlroutenote">HTML route note</span>'
      }
    },
    {
      method: 'GET',
      path: '/withnotesarray',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.string().note(
              '<span class="htmltypenote">HTML type note</span>',
              '<span class="htmltypenote">HTML type note</span>'
            )
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withexample',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.string()
              .regex(/^\w{1,5}$/)
              .example('abcde')
          })
        }
      }
    },
    {
      method: 'POST',
      path: '/denybody',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          payload: Joi.boolean().falsy(),
        }
      }
    },
    {
      method: 'POST',
      path: '/rootemptyobject',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          payload: Joi.object()
        }
      }
    },
    {
      method: 'GET',
      path: '/withnestedexamples',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.object({
              param2: Joi.object({
                param3: Joi.number().example(5)
              }).example({
                param3: 5
              })
            }).example({
              param2: {
                param3: 5
              }
            })
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withmeta',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.string().meta({
              index: true,
              unique: true
            })
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withunit',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.number().unit('ms')
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withdefaultvalue',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.number().default(42)
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withbinaryencoding',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.binary()
              .min(42)
              .max(128)
              .length(64)
              .encoding('base64')
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withdate',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.date()
              .min('1-1-1974')
              .max('12-31-2020')
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withpeersconditions',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.object()
              .and('a', 'b', 'c')
              .or('a', 'b', 'c')
              .xor('a', 'b', 'c')
              .with('a', ['b', 'c'])
              .without('a', ['b', 'c'])
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withpattern',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.object({
              a: Joi.string()
            }).pattern(/\w\d/, Joi.boolean())
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withallowunknown',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.object().unknown(),
            param2: Joi.object().unknown(false)
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withstringspecifics',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.string()
              .alphanum()
              .regex(/\d{3}.*/)
              .token()
              .email()
              .guid()
              .isoDate()
              .hostname()
              .lowercase()
              .uppercase()
              .trim(),
            param2: Joi.string().email()
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withconditionalalternatives',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.alternatives()
              .conditional('b', {
                is: 5,
                then: Joi.string()
              })
              .conditional('a', {
                is: true,
                then: Joi.date(),
                otherwise: Joi.any()
              }),
            param2: Joi.alternatives()
              .conditional('b', {
                is: 5,
                then: Joi.string()
              })
              .conditional('a', {
                is: true,
                otherwise: Joi.any()
              })
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withreferences',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.ref('a.b'),
            param2: Joi.ref('$x')
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withassert',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.object().assert('d.e', Joi.ref('a.c'), 'equal to a.c'),
            param2: Joi.object().assert('$x', Joi.ref('b.e'), 'equal to b.e')
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withproperties',
      vhost: 'john.doe',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        cors: {
          maxAge: 12345
        },
        jsonp: 'callback'
      }
    },
    {
      method: 'OPTIONS',
      path: '/optionstest',
      handler: Helper.defaultHandler
    },
    {
      method: 'GET',
      path: '/withrulereference',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.date().min(Joi.ref('param2')),
            param2: Joi.date()
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/withcorstrue',
      vhost: 'john.doe',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        cors: true
      }
    },
    {
      method: 'GET',
      path: '/withstrip',
      options: {
        tags: ['api'],
        handler: Helper.defaultHandler,
        validate: {
          query: Joi.object({
            param1: Joi.any().strip(),
            param2: Joi.any()
          })
        }
      }
    },
    {
      method: 'GET',
      path: '/internal',
      options: {
        tags: ['api'],
        isInternal: true,
        handler: Helper.defaultHandler
      }
    }
  ];

  lab.test('all routes parsed', async () => {
    const server = await Helper.createServer({}, routes);
    const response = await server.inject({ method: 'GET', url: '/swagger.json' });
    expect(response.statusCode).to.equal(200);
    // the 40 to 45 difference is in one route having a number of methods
    // expect(response.result.paths).to.have.length(40);
  });
});
