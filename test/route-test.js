/*
Mocha test
*/

var chai = require('chai'),
   assert = chai.assert,
   swagger = require('../lib/index.js');

var internals = swagger._internals;


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