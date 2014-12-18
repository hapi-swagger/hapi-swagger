/*
Mocha test
Tests that note array is broken up correctly
*/

var chai = require('chai'),
   Hapi = require('hapi'),
   assert = chai.assert;

var defaultHandler = function(request, response) {
  reply('ok');
};

var testNotes1 = [
        'This is a note about this API endpoint',
        'This is more stuff about this API endpoint',
    ],
    testNotes2 = [
        'This is a note about this API endpoint'
    ],
    testNotes3 = 'This is a note about this API endpoint';

describe('notes test', function() {

    var server;

    beforeEach(function(done) {
      server = new Hapi.Server();
      server.connection({ host: 'test' });
      server.register({register: require('../lib/index.js')}, function(err) {
        assert.ifError(err);
        done();
      });
    });

    afterEach(function(done) {
      server.stop(function() {
        server = null;
        done();
      });
    });

    describe('if notes array', function() {

      it('when array length > 1 notes has <br/><br/> injected', function(done) {
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
          done();
        });
      });

      it('array length equal 1 notes has no <br/>', function(done) {
        server.route({
          method: 'GET',
          path: '/test',
          handler: defaultHandler,
          config: {
            tags: ['api'],
            notes: testNotes2
          }
        });
        server.inject({ method: 'GET', url: '/docs?path=test '}, function (response) {
          assert.equal(response.result.apis[0].operations[0].notes, 'This is a note about this API endpoint' );
          done();
        });
      });
    });

    describe('if notes is string', function() {

      beforeEach(function() {
        server.route({
          method: 'GET',
          path: '/test',
          handler: defaultHandler,
          config: {
            tags: ['api'],
            notes: testNotes3
          }
        });
      });
      it('returns the string', function(done) {
        server.inject({ method: 'GET', url: '/docs?path=test '}, function (response) {
          assert.equal(response.result.apis[0].operations[0].notes, testNotes3 );
          done();
        });
      });
    });
});