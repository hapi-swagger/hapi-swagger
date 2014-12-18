/*
Mocha test
*/

var chai = require('chai'),
   Hapi = require('hapi'),
   assert = chai.assert;

describe('register test', function() {

  var server;

  beforeEach(function(done) {
    server = new Hapi.Server();
    server.connection({ host: 'test' });

    done(); 
  })

  afterEach(function(done) {
    server.stop(function() {
      server = null;
      done();
    });
  })

  it('registers without error', function(done){ 
    server.register({register: require('../lib/index.js')}, function(err) {
      assert.ifError(err)

      done();
    });
  });

  it('is documentation page enabled by default', function(done){
    server.register({register: require('../lib/index.js')}, function(err) {
      assert.ifError(err)

      var routes = [];
      server.table()[0].table.forEach(function(item) {
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