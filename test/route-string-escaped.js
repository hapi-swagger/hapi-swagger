/*
Mocha test
Checks that escaped string for regex work
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
  
  
  describe('test regex escape $', function() {

      beforeEach(function() {
        
        server.route({
          method: 'GET',
          path: '/$test',
          config: {
            tags: ['api'],
            notes: 'test',
            handler: defaultHandler,
            validate: {
                query: {
                  param1: Joi.string()
                }
              },
          }
        });
        
      });
      
   
      it('GET method added', function(done) {
        server.inject({ method: 'GET', url: '/docs?path=$test '}, function (response) {
			//console.log(JSON.stringify(response.result))
          assert.equal(response.result.apis[0].operations[0].nickname, '$test' );
          done();
        });
      });

  });
  
  
  describe('test regex escape /boom())', function() {

      beforeEach(function() {
        
        server.route({
          method: 'GET',
          path: '/boom()',
          config: {
            tags: ['api'],
            notes: 'test',
            handler: defaultHandler,
            validate: {
                query: {
                  param1: Joi.string()
                }
              },
          }
        });
        
      });
      
   
      it('GET method added', function(done) {
        server.inject({ method: 'GET', url: '/docs?path=boom()'}, function (response) {
          assert.equal(response.result.apis[0].operations[0].nickname, 'boom()' );
          done();
        });
      });

  });
  
  
  
 
  
});
