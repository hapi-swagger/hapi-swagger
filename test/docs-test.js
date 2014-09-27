var chai = require('chai'),
   Hapi = require('hapi'),
   assert = chai.assert,
   Joi = require('joi'),
   swagger = require('../lib/index.js');

describe('docs tags', function() {

  var server;

  beforeEach(function(done) {
    server = new Hapi.Server({debug: false});
    server.pack.register(swagger, function(err) {
      assert.ifError(err)
      done();
    });
  });

  afterEach(function(done) {
    server.stop(function() {
      server = null;
      done();
    });
  });

  it('loads the docs without error', function(done){ 
    server.route({
        method: 'GET',
        path: '/test',
        handler: function(request, response) {
          reply('ok');
        },
        config: {
          tags: ['api'],
          validate: {
            query: Joi.any()
          }
        }
    });

    server.inject({method: 'GET', url: '/docs'}, function(response) {
      assert(response.statusCode === 200)
      done();
    })
  });

  it('filters routes by tags', function(done){ 
    server.route([
      {
          method: 'GET',
          path: '/test',
          handler: function(request, response) {
            reply('ok');
          },
          config: {
            tags: ['api', 'test'],
            validate: {
              query: Joi.any()
            }
          }
      },
      {
          method: 'GET',
          path: '/notest',
          handler: function(request, response) {
            reply('ok');
          },
          config: {
            tags: ['api', 'not'],
            validate: {
              query: Joi.any()
            }
          }
      }
    ]);

    server.inject({method: 'GET', url: '/docs?tags=test'}, function(response) {
      assert(response.statusCode === 200)
      assert(response.result.apis.length == 1 && response.result.apis[0].path == 'test')
      done();
    })
  });

  it('filters out routes with minus tags', function(done){ 
    server.route([
      {
          method: 'GET',
          path: '/include',
          handler: function(request, response) {
            reply('ok');
          },
          config: {
            tags: ['api', 'include'],
            validate: {
              query: Joi.any()
            }
          }
      },
      {
          method: 'GET',
          path: '/notinclude',
          handler: function(request, response) {
            reply('ok');
          },
          config: {
            tags: ['api', 'include', 'notinclude'],
            validate: {
              query: Joi.any()
            }
          }
      }
    ]);

    server.inject({method: 'GET', url: '/docs?tags=include,-notinclude'}, function(response) {
      assert(response.statusCode === 200)
      assert(response.result.apis.length == 1 && response.result.apis[0].path == 'include')
      done();
    })
  });

  it('filters in only routes with both tags when plus operator is used', function(done){ 
    server.route([
      {
          method: 'GET',
          path: '/onetag',
          handler: function(request, response) {
            reply('ok');
          },
          config: {
            tags: ['api', 'include'],
            validate: {
              query: Joi.any()
            }
          }
      },
      {
          method: 'GET',
          path: '/bothtags',
          handler: function(request, response) {
            reply('ok');
          },
          config: {
            tags: ['api', 'include', 'alsoinclude'],
            validate: {
              query: Joi.any()
            }
          }
      }
    ]);

    server.inject({method: 'GET', url: '/docs?tags=include,+alsoinclude'}, function(response) {
      assert(response.statusCode === 200)
      assert(response.result.apis.length == 1 && response.result.apis[0].path == 'bothtags')
      done();
    })
  });

  it('returns 404 if no routes are returned', function(done){ 
    server.route([
      {
          method: 'GET',
          path: '/onetag',
          handler: function(request, response) {
            reply('ok');
          },
          config: {
            tags: ['api', 'include'],
            validate: {
              query: Joi.any()
            }
          }
      },
      {
          method: 'GET',
          path: '/bothtags',
          handler: function(request, response) {
            reply('ok');
          },
          config: {
            tags: ['alsoinclude'],
            validate: {
              query: Joi.any()
            }
          }
      }
    ]);

    server.inject({method: 'GET', url: '/docs?tags=notvalid'}, function(response) {
      assert(response.statusCode === 404)
      done();
    })
  });

});


describe('docs path', function() {

  var server;

  beforeEach(function(done) {
    server = new Hapi.Server({debug: false});
    server.pack.register(swagger, function(err) {
      assert.ifError(err)
      done();
    });
  });

  afterEach(function(done) {
    server.stop(function() {
      server = null;
      done();
    });
  });



  it('returns routes filtered by path', function(done){ 
    server.route([
      {
          method: 'GET',
          path: '/parent/child1',
          handler: function(request, response) {
            reply('ok');
          },
          config: {
            tags: ['api', 'include'],
            validate: {
              query: Joi.any()
            }
          }
      },
      {
          method: 'GET',
          path: '/parent/child2',
          handler: function(request, response) {
            reply('ok');
          },
          config: {
            tags: ['api', 'alsoinclude'],
            validate: {
              query: Joi.any()
            }
          }
      },
      {
          method: 'GET',
          path: '/parent2/child2',
          handler: function(request, response) {
            reply('ok');
          },
          config: {
            tags: ['alsoinclude'],
            validate: {
              query: Joi.any()
            }
          }
      }
    ]);

    server.inject({method: 'GET', url: '/docs?path=parent'}, function(response) {
      console.log(response.result)
      assert(response.statusCode === 200)
      assert(response.result.apis.length == 2)
      done();
    })
  });
})