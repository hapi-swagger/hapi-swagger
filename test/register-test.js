/*
Mocha test
*/

var chai = require('chai'),
   Hapi = require('hapi'),
   assert = chai.assert,
   swagger = require('../lib/index.js');

describe('register test', function() {

  var server;

  beforeEach(function(done) {
    server = new Hapi.Server({debug: false});

    done(); 
  })

  afterEach(function(done) {
    server.stop(function() {
      server = null;
      done();
    });
  })

  it('registers without error', function(done){ 
    server.pack.register(swagger, function(err) {
      assert.ifError(err)

      done();
    });
  });

  it('has documentation page enabled by fault', function(done){
    server.pack.register(swagger, function(err) {
      assert.ifError(err)

      var routes = [];
      server.table().forEach(function(item) {
        routes.push(item.path);
      });
      assert(routes.indexOf('/documentation') >= 0);

      server.inject({method: 'GET', url: '/documentation' }, function(res) {
        assert(res.statusCode === 200)
        done();
      })
    });
  });

});