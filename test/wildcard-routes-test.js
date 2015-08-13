/*
Mocha test
This test was created for issue #144
*/

var Chai            = require('chai'),
    Hapi            = require('hapi'),
    Joi             = require('joi'),
    Inert           = require('inert'),
    Vision          = require('vision'),
    Hoek            = require('hoek'),
    HapiSwagger     = require('../lib/index.js');
    assert          = Chai.assert;


var defaultHandler = function(request, response) {
  reply('ok');
};


describe('method property', function() {
  
  var server
  
  beforeEach(function(done) {
    server = new Hapi.Server();
    server.connection();
    server.register([Inert, Vision, HapiSwagger], function(err){
      server.start(function(err){
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
  
  
  describe('use of wildcard ie *', function() {

      beforeEach(function() {
        server.route({
          method: '*',
          path: '/test',
          handler: defaultHandler,
          config: {
            tags: ['api'],
            notes: 'test'
          }
        });
      });
      
   
      it('GET method added', function(done) {
        server.inject({ method: 'GET', url: '/docs?path=test '}, function (response) {
          console.log(response.result.apis[1].operations[0].method);
          assert.equal(response.result.apis[0].operations[0].method, 'GET' );
          done();
        });
      });
      
     it('POST method added', function(done) {
        server.inject({ method: 'GET', url: '/docs?path=test '}, function (response) {
          assert.equal(response.result.apis[1].operations[0].method, 'POST' );
          done();
        });
      });
     
      
  });
  
  
  describe('use of array ["GET", "POST"]', function() {

      beforeEach(function() {
        server.route({
          method: ['GET', 'POST'],
          path: '/test',
          handler: defaultHandler,
          config: {
            tags: ['api'],
            notes: 'test'
          }
        });
      });
      
   
      it('GET method added', function(done) {
        server.inject({ method: 'GET', url: '/docs?path=test '}, function (response) {
          console.log(response.result.apis[1].operations[0].method);
          assert.equal(response.result.apis[0].operations[0].method, 'GET' );
          done();
        });
      });
      
     it('POST method added', function(done) {
        server.inject({ method: 'GET', url: '/docs?path=test '}, function (response) {
          assert.equal(response.result.apis[1].operations[0].method, 'POST' );
          done();
        });
      });
     
      
  });
 
  
});
