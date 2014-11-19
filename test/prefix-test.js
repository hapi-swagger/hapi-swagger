/*
Mocha test
*/

var chai = require('chai'),
   assert = chai.assert,
   swagger = require('../lib/index.js');

var internals = swagger._internals;


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
