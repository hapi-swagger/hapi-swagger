/*
Mocha test
*/

var Chai            = require('chai'),
    Hapi            = require('hapi'),
    Joi             = require('joi'),
    Inert           = require('inert'),
    Vision          = require('vision'),
    Hoek            = require('hoek'),
    HapiSwagger     = require('../lib/index.js'),
    assert          = Chai.assert;

   var routesArr = [
      '/movies',
      '/movies/',
      '/movies/{id}',
      '/movies/{id}/',
      '/movies/scenes',
      '/movies/scenes/',
      '/moviescenes',
      '/moviescenes/',
      '/actor/movies',
      '/actor/movies/'
   ]; 
   
   var defaultHandler = function(request, reply) {
      reply('ok');
   };  
   
   var routes = routesArr.map(function( path ){
      return  {
          'method': 'GET',
          'path': path,
          'handler': defaultHandler,
          'config': {
            'tags': ['api']
          }
      }
   }); 
   
   
   
   
  describe('route parsing', function() {
      var server;
      
      beforeEach(function (done) {
        server = new Hapi.Server();
        server.connection();
        server.register([
          Inert,
          Vision,
          HapiSwagger
        ], function (err) {
          server.start(function (err) {
            assert.ifError(err);
          });
        });
        server.route(routes);
        done();
      });
    
      afterEach(function (done) {
        server.stop(function () {
          server = null;
          done();
        });
      });
      
      
      describe('correctly pathed', function() {
          
          it('movies has /movies', function(done) {
            server.inject({ method: 'GET', url: '/docs?path=movies'}, function (response) {
              assert.equal( hasPath( response.result, '/movies' ), true);
              done();
            });
          });
          
         
          it('movies has /movies/', function(done) {
            server.inject({ method: 'GET', url: '/docs?path=movies'}, function (response) {
              assert.equal( hasPath( response.result, '/movies/' ), true);
              done();
            });
          });
          
          
          it('movies has /movies/{id}', function(done) {
            server.inject({ method: 'GET', url: '/docs?path=movies'}, function (response) {
              assert.equal( hasPath( response.result, '/movies/{id}' ), true);
              done();
            });
          });
          
          
          it('movies has /movies/scenes', function(done) {
            server.inject({ method: 'GET', url: '/docs?path=movies'}, function (response) {
              assert.equal( hasPath( response.result, '/movies/scenes' ), true);
              done();
            });
          });
          
          
          it('movies has /moviescenes', function(done) {
            server.inject({ method: 'GET', url: '/docs?path=movies'}, function (response) {
              assert.equal( hasPath( response.result, '/moviescenes' ), false);
              done();
            });
          });
          
          
          it('movies has /moviescenes/', function(done) {
            server.inject({ method: 'GET', url: '/docs?path=movies'}, function (response) {
              assert.equal( hasPath( response.result, '/moviescenes/' ), false);
              done();
            });
          });
          
         
          it('movies has /actor/movies', function(done) {
            server.inject({ method: 'GET', url: '/docs?path=movies'}, function (response) {
              assert.equal( hasPath( response.result, '/actor/movies' ), false);
              done();
            });
          });
          
 
          it('moviescenes', function(done) {
            server.inject({ method: 'GET', url: '/docs?path=moviescenes'}, function (response) {
              assert.equal( hasPath( response.result, '/moviescenes/' ), true);
              done();
            });
          });
          
          
          it('moviescenes', function(done) {
            server.inject({ method: 'GET', url: '/docs?path=moviescenes'}, function (response) {
              assert.equal( hasPath( response.result, '/movies' ), false);
              done();
            });
          });
          
          
          it('moviescenes', function(done) {
            server.inject({ method: 'GET', url: '/docs?path=moviescenes'}, function (response) {
              assert.equal( hasPath( response.result, '/movies/' ), false);
              done();
            });
          });
          
          
         it('actor', function(done) {
            server.inject({ method: 'GET', url: '/docs?path=actor'}, function (response) {
              assert.equal( hasPath( response.result, '/movies' ), false);
              done();
            });
          });
          
          
         it('actor', function(done) {
            server.inject({ method: 'GET', url: '/docs?path=actor'}, function (response) {
              assert.equal( hasPath( response.result, '/movies' ), false);
              done();
            });
          });
            
      });

  });
  
  
  // if path in swagger paths
  function hasPath( swaggerJSON, path ){
    if(swaggerJSON && swaggerJSON.apis){
      var i = swaggerJSON.apis.length;
      while (i--) {
          if(swaggerJSON.apis[i].path === path ){
            return true;
          }
      }
    }
    return false;
  }


/*

// Based on pull request by David Waterston  - http://jsfiddle.net/davidwaterston/cC4v8/
describe('route parsing test', function() {

   var routes = [
      '/movies',
      '/movies/',
      '/movies/{id}',
      '/movies/{id}/',
      '/movies/scenes',
      '/movies/scenes/',
      '/moviescenes',
      '/moviescenes/',
      '/actor/movies',
      '/actor/movies/'
   ];



   it('isResourceRoute should return true for: /movies, movies', function(){
      assert.equal( internals.isResourceRoute('/movies', 'movies'), true );
   })

   it('isResourceRoute should return true for: /movies, movies', function(){
      assert.equal( internals.isResourceRoute('/movies', 'movies'), true );
   })

   it('isResourceRoute should return true for: /movies/{id}, movies', function(){
      assert.equal( internals.isResourceRoute('/movies/{id}', 'movies'), true );
   })

   it('isResourceRoute should return true for: /movies/{id}/, movies', function(){
      assert.equal( internals.isResourceRoute('/movies/{id}/', 'movies'), true );
   })

   it('isResourceRoute should return true for: /movies/scenes, movies', function(){
      assert.equal( internals.isResourceRoute('/movies/scenes', 'movies'), true );
   })

   it('isResourceRoute should return false for: /moviescenes, movies', function(){
      assert.equal( internals.isResourceRoute('/moviescenes', 'movies'), false );
   })

   it('isResourceRoute should return false for: /moviescenes/, movies', function(){
      assert.equal( internals.isResourceRoute('/moviescenes/', 'movies'), false );
   })

   it('isResourceRoute should return false for: /actor/movies, movies', function(){
      assert.equal( internals.isResourceRoute('/actor/movies', 'movies'), false );
   })

   it('isResourceRoute should return false for: /actor/movies/, movies', function(){
      assert.equal( internals.isResourceRoute('/actor/movies/', 'movies'), false );
   })


})


*/