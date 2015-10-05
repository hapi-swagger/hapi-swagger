/*
Mocha test
*/

var Chai            = require('chai'),
    Hapi            = require('hapi'),
    Joi             = require('joi'),
    Inert           = require('inert'),
    Vision          = require('vision'),
    HapiSwagger     = require('../lib/index.js');
    assert          = Chai.assert;
   
    
var defaultHandler = function(request, response) {
  reply('ok');
};


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
    server.register([Inert, Vision, HapiSwagger], function(err) {
      assert.ifError(err)
      done();
    });
  });
  
});


describe('register test find injected route', function() {
  
    var server;
  
    beforeEach(function(done) {
      server = new Hapi.Server();
      server.connection();
      server.register([Inert, Vision, HapiSwagger], function(err){
        server.start(function(err){
          server.route([{
              method: 'GET',
              path: '/test',
              handler: defaultHandler,
              config: {
                tags: ['api', 'test']
              }
          }]);
          
          assert.ifError(err);
          done();
        });
      });
    });
  
    afterEach(function(done) {
      server.stop(function() {
        server = null;
        done();
      });
    });
      
    it('find injected route', function(done){ 
      var routes = [];
      server.table()[0].table.forEach(function(item) {
        routes.push(item.path);
      });
      assert(routes.indexOf('/documentation') >= 0);
      done();
    });
    
    it('registers without error', function(done){ 
      server.inject({method: 'GET', url: '/documentation' }, function(res) {
        assert(res.statusCode === 200)
        done();
      })
    });
   
  

});
