/*
Mocha test
*/

var chai = require('chai'),
   Hapi = require('hapi'),
   assert = chai.assert,
   swagger = require('../lib/index.js');

describe('register test', function() {

  it('registers without error', function(){ 
    var server = new Hapi.Server({debug: false});

    server.pack.register(swagger, function(err) {
      assert.ifError(err)
    });
  });

});