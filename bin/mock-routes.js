var Joi = require('joi');

var handler = function(request, reply) {
  reply('ok');
};

module.exports = [{
  method: 'GET',
  path: '/test',
  config: {
    handler: handler,
    validate: {
      query: {
        param1: Joi.string().required()
      }
    },
    tags: ['admin', 'api'],
    description: 'Test GET',
    notes: 'test note'
  }
}, {
  method: 'GET',
  path: '/another/test',
  config: {
    handler: handler,
    validate: {
      query: {
        param1: Joi.string().required()
      }
    },
    tags: ['admin', 'api']
  }
}, {
  method: 'GET',
  path: '/zanother/test',
  config: {
    handler: handler,
    validate: {
      query: {
        param1: Joi.string().required()
      }
    },
    tags: ['admin', 'api']
  }
}, {
  method: 'POST',
  path: '/test',
  config: {
    handler: handler,
    validate: {
      query: {
        param2: Joi.string().valid('first', 'last')
      }
    },
    tags: ['admin', 'api']
  }
}, {
  method: 'DELETE',
  path: '/test',
  config: {
    handler: handler,
    validate: {
      query: {
        param2: Joi.string().valid('first', 'last')
      }
    },
    tags: ['admin', 'api']
  }
}, {
  method: 'PUT',
  path: '/test',
  config: {
    handler: handler,
    validate: {
      query: {
        param2: Joi.string().valid('first', 'last')
      }
    },
    tags: ['admin', 'api']
  }
}, {
  method: 'GET',
  path: '/notincluded',
  config: {
    handler: handler,
    plugins: {
      lout: false
    }
  }
}, {
  method: 'GET',
  path: '/nested',
  config: {
    handler: handler,
    validate: {
      query: {
        param1: Joi.object({
          nestedparam1: Joi.string().required()
        })
      }
    }
  }
}, {
  method: 'GET',
  path: '/rootobject',
  config: {
    handler: handler,
    validate: {
      query: Joi.object({
        param1: Joi.string().required()
      })
    }
  }
}, {
  method: 'GET',
  path: '/path/{pparam}/test',
  config: {
    handler: handler,
    validate: {
      params: {
        pparam: Joi.string().required()
      }
    }
  }
}, {
  method: 'GET',
  path: '/emptyobject',
  config: {
    handler: handler,
    validate: {
      query: {
        param1: Joi.object()
      }
    }
  }
}, {
  method: 'GET',
  path: '/alternatives',
  config: {
    handler: handler,
    validate: {
      query: {
        param1: Joi.alternatives(Joi.number().required(), Joi.string().valid('first', 'last'))
      }
    }
  }
}, {
  method: 'GET',
  path: '/novalidation',
  config: {
    handler: handler
  }
}, {
  method: 'GET',
  path: '/withresponse',
  config: {
    handler: handler,
    response: {
      schema: {
        param1: Joi.string()
      }
    }
  }
}, {
  method: 'GET',
  path: '/withhtmlnote',
  config: {
    handler: handler,
    validate: {
      query: {
        param1: Joi.string().notes('<span class="htmltypenote">HTML type note</span>')
      }
    },
    notes: '<span class="htmlroutenote">HTML route note</span>'
  }
}, {
  method: 'POST',
  path: '/denybody',
  config: {
    handler: handler,
    validate: {
      payload: false
    }
  }
}, {
  method: 'POST',
  path: '/rootemptyobject',
  config: {
    handler: handler,
    validate: {
      payload: Joi.object()
    }
  }
},{
  method: 'GET',
  path: '/boom()',
  config: {
    tags: ['api'],
    notes: 'test',
    handler: handler,
    validate: {
        query: {
          param1: Joi.string()
        }
      },
  }
},{
  method: 'GET',
  path: '/$code',
  config: {
    tags: ['api'],
    notes: 'test',
    handler: handler,
    validate: {
        query: {
          param1: Joi.string()
        }
      },
  }
},{
  method: 'GET',
  path: '/test/{page}/route/{pagesize}',
  config: {
    description: 'Hapi-swagger bug test',
    tags: ['api', 'private'],
    validate: {
      params: {
        page: Joi.number().required(),
        pagesize: Joi.number().required()
      }
    },
    auth: false,
    handler: function(request, reply) {

      var page = request.params.page;
      var pagesize = request.params.pagesize;
      //this will be the value of page
      reply(pagesize);
    }
  }
},{
    method: 'GET',
    path: '/models/{username}',
    config: {
        handler: function (request, reply) {
            reply("list of models")
        },
        description: 'Get todo',
        notes: 'Returns a todo item by the id passed in the path',
        tags: ['api'],
        plugins: {
            'hapi-swagger': {
              nickname: 'modelsapi'
            }
          },
        validate: {
            params: {
                username: Joi.number()
                    .required()
                    .description('the id for the todo item')
            }
        }
    }
}];