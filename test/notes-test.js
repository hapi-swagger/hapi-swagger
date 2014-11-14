/*
Mocha test
Tests that note array is broken up correctly
*/

var chai = require('chai'),
   Hapi = require('hapi'),
   assert = chai.assert,
   swagger = require('../lib/index.js');

var defaultHandler = function(request, response) {
  reply('ok');
};

var testNotes1 = [
        'This is a note about this API endpoint',
        'This is more stuff about this API endpoint',
        'Error Status Codes',
        '400, Bad Request',
        '404, Sum not found'
    ],
    testNotes2 = [
        'This is a note about this API endpoint'
    ],
    testNotes3 = 'This is a note about this API endpoint',
    testNotes4 = [
        'This is a note about this API endpoint',
        'This is more stuff about this API endpoint',
        'Error status codes:',
        '400, Bad Request',
        '404, Sum not found'
    ]

describe('notes test', function() {

    var server;

    beforeEach(function(done) {
      server = new Hapi.Server({debug: false});
      server.pack.register(swagger, function(err) {
        assert.ifError(err)
        done();
      });
    });

    afterEach(function(done) {
      server.stop(function() {
        server = null;
        done();
      });
    });

    describe.only('array', function() {

      it('when array length > 1 notes has <br/><br/> injected', function() {
        server.route({
          method: 'GET',
          path: '/test',
          handler: defaultHandler,
          config: {
            tags: ['api'],
            notes: testNotes1
          }
        });
        server.inject({ method: 'GET', url: '/docs?path=test '}, function (response) {
          assert.equal(response.result.apis[0].operations[0].notes, 'This is a note about this API endpoint<br/><br/>This is more stuff about this API endpoint' );
        });
      });

      it('array length equal 1 notes has no <br/>', function() {
        server.route({
          method: 'GET',
          path: '/test',
          handler: defaultHandler,
          config: {
            tags: ['api'],
            notes: testNotes1
          }
        });
        server.inject({ method: 'GET', url: '/docs?path=test '}, function (response) {
          assert.equal(response.result.apis[0].operations[0].notes, 'This is a note about this API endpoint' );
        });
      });
    });

});





describe('notes simple array test', function() {

    it('notes has no <br/>', function() {
        assert.equal( notes, 'This is a note about this API endpoint' );
    });

    it('responseMessages is an empty array', function() {
        assert.equal( responseMessages.length, 0 );
    });

});



describe('notes string test', function() {

    it('notes contains string', function() {
        assert.equal( notes, 'This is a note about this API endpoint' );
    });

    it('responseMessages is an empty array', function() {
        assert.equal( responseMessages.length, 0 );
    });

});

describe('notes mixed case detection test', function() {

    it('responseMessages has 2 objects', function() {
        assert.equal( responseMessages.length, 2 );
    });

});




