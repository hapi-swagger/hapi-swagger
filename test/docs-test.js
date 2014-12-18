var chai = require('chai'),
   Hapi = require('hapi'),
   assert = chai.assert,
   Joi = require('joi');

var defaultHandler = function(request, response) {
  reply('ok');
};

describe('docs tags', function() {

  var server;

  beforeEach(function(done) {
    server = new Hapi.Server();
    server.connection({ host: 'test' });
    server.register({register: require('../lib/index.js')}, function(err) {
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
        handler: defaultHandler,
        config: {
          tags: ['api']
        }
    });

    server.inject({method: 'GET', url: '/docs'}, function(response) {
      assert(response.statusCode === 200);
      done();
    });
  });

  it('filters routes by tags', function(done){ 
    server.route([
      {
          method: 'GET',
          path: '/test',
          handler: defaultHandler,
          config: {
            tags: ['api', 'test']
          }
      },
      {
          method: 'GET',
          path: '/notest',
          handler: defaultHandler,
          config: {
            tags: ['api', 'not']
          }
      }
    ]);

    server.inject({method: 'GET', url: '/docs?tags=test'}, function(response) {
      assert(response.statusCode === 200);
      assert(response.result.apis.length == 1 && response.result.apis[0].path == 'test');
      done();
    });
  });

  it('filters out routes with minus tags', function(done){ 
    server.route([
      {
          method: 'GET',
          path: '/include',
          handler: defaultHandler,
          config: {
            tags: ['api', 'include']
          }
      },
      {
          method: 'GET',
          path: '/notinclude',
          handler: defaultHandler,
          config: {
            tags: ['api', 'include', 'notinclude']
          }
      }
    ]);

    server.inject({method: 'GET', url: '/docs?tags=include,-notinclude'}, function(response) {
      assert(response.statusCode === 200);
      assert(response.result.apis.length == 1 && response.result.apis[0].path == 'include');
      done();
    });
  });

  it('filters in only routes with both tags when plus operator is used', function(done){ 
    server.route([
      {
          method: 'GET',
          path: '/onetag',
          handler: defaultHandler,
          config: {
            tags: ['api', 'include']
          }
      },
      {
          method: 'GET',
          path: '/bothtags',
          handler: defaultHandler,
          config: {
            tags: ['api', 'include', 'alsoinclude']
          }
      }
    ]);

    server.inject({method: 'GET', url: '/docs?tags=include,+alsoinclude'}, function(response) {
      assert(response.statusCode === 200);
      assert(response.result.apis.length == 1 && response.result.apis[0].path == 'bothtags');
      done();
    });
  });

  it('returns 404 if no routes are returned', function(done){ 
    server.route([
      {
          method: 'GET',
          path: '/onetag',
          handler: defaultHandler,
          config: {
            tags: ['api', 'include']
          }
      },
      {
          method: 'GET',
          path: '/bothtags',
          handler: defaultHandler,
          config: {
            tags: ['alsoinclude']
          }
      }
    ]);

    server.inject({method: 'GET', url: '/docs?tags=notvalid'}, function(response) {
      assert(response.statusCode === 404);
      done();
    })
  });
});


describe('docs path', function() {

  var server;

  beforeEach(function(done) {
    server = new Hapi.Server();
    server.connection({ host: 'test' });
    server.register({register: require('../lib/index.js')}, function(err) {
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
          handler: defaultHandler,
          config: {
            tags: ['api', 'include']
          }
      },
      {
          method: 'GET',
          path: '/parent/child2',
          handler: defaultHandler,
          config: {
            tags: ['api', 'alsoinclude']
          }
      },
      {
          method: 'GET',
          path: '/parent2/child2',
          handler: defaultHandler,
          config: {
            tags: ['alsoinclude']
          }
      }
    ]);

    server.inject({method: 'GET', url: '/docs?path=parent'}, function(response) {
      assert(response.statusCode === 200);
      assert(response.result.apis.length == 2);
      done();
    });
  });
});