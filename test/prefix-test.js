/*
Mocha test for segment prefix depth
*/


var Chai            = require('chai'),
    Hapi            = require('hapi'),
    Joi             = require('joi'),
    Inert           = require('inert'),
    Vision          = require('vision'),
    Hoek            = require('hoek'),
    HapiSwagger     = require('../lib/index.js'),
    assert          = Chai.assert;
   
   
var defaultHandler = function(request, reply) {
      reply('ok');
    },
    routes = [ 
       {
          method: '*',
          path: '/',
          handler: defaultHandler,
          config: {
            tags: ['api']
          }
      }, {
          method: '*',
          path: '/one',
          handler: defaultHandler,
          config: {
            tags: ['api']
          }
      }, {
          method: '*',
          path: '/one/two',
          handler: defaultHandler,
          config: {
            tags: ['api']
          }
      }, {
          method: '*',
          path: '/one/two/three',
          handler: defaultHandler,
          config: {
            tags: ['api']
          }
      }]





describe('prefix', function() {
  
  var server
  
  beforeEach(function(done) {
    server = new Hapi.Server();
    server.connection();
    done();
  });

  afterEach(function(done) {
    server.stop(function() {
      server = null;
      done();
    });
  });
  
  
  describe('first segment', function() {

      beforeEach(function(done) {
        server.register([
          Inert, 
          Vision, 
          {
            register: HapiSwagger,
            options: {"pathPrefixSize": 1}
          }], function(err){
          server.start(function(err){
            assert.ifError(err);
          });
        });
        server.route(routes);
        done();
      });
      
      it('GET method added', function(done) {
        server.inject({ method: 'GET', url: '/docs '}, function (response) {
          //console.log(JSON.stringify(response.result));
          assert.equal(response.result.apis.length, 2);
          done();
        });
      });
        
  });
  
  
  describe('second segment', function() {

      beforeEach(function(done) {
        server.register([
          Inert, 
          Vision, 
          {
            register: HapiSwagger,
            options: {"pathPrefixSize": 2}
          }], function(err){
          server.start(function(err){
            assert.ifError(err);
          });
        });
        server.route(routes);
        done();
      });
      
   
      it('GET method added', function(done) {
        server.inject({ method: 'GET', url: '/docs '}, function (response) {
          //console.log(JSON.stringify(response.result));
          assert.equal(response.result.apis.length, 3);
          done();
        });
      });
        
  });
  
  
 
 
  
});
 
   
   

/*
No longer works as we can no longer reference internal functions, but left in code for reference

var internals = swagger.options;


describe('prefix test', function() {

it('isPrefix default', function(){
    var res = internals._commonPrefix({pathPrefixSize: 1}, '/lala/foo');
      assert.equal( res, 'lala' );
});

it('isPrefix nothing', function(){
    var res = internals._commonPrefix({pathPrefixSize: 1}, '/');
      assert.equal( res, '' );
});

it('isPrefix length 2', function(){
    var res = internals._commonPrefix({pathPrefixSize: 2}, '/lala/foo');
      assert.equal( res, 'lala/foo' );
});

it('isPrefix length 2 extra', function(){
    var res = internals._commonPrefix({pathPrefixSize: 2}, '/lala/foo/blah');
      assert.equal( res, 'lala/foo' );
});

it('isPrefix length 2 short route', function(){
    var res = internals._commonPrefix({pathPrefixSize: 2}, '/lala');
      assert.equal( res, 'lala' );
});

});

*/


