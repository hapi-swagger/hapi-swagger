/*
Mocha test
This test was created for issue #103
*/

var chai = require('chai'),
   Hapi = require('hapi'),
   Joi = require('joi'),
   assert = chai.assert;

var defaultHandler = function(request, response) {
  reply('ok');
};


describe('model structure', function() {

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


    it('should support child models', function(done) {

      server.route([{
        method: 'POST',
        path: '/foo/v1/bar',
        config: {
          description: '...',
          tags: ['api'],
          validate: {
            payload: Joi.object({
              outer1: Joi.object({
                inner1: Joi.string()
              }),
              outer2: Joi.object({
                inner2: Joi.string()
              })
            })
          },
          handler: function () {}
        }
      }]);


      server.inject({ method: 'GET', url: '/docs?path=foo '}, function (response) {
        //console.log(JSON.stringify(response.result.models));

        var outer1 = JSON.parse(JSON.stringify(response.result.models.outer1));
        assert.deepEqual(outer1, {
          "id": "outer1",
          "type": "object",
            "properties": {
              "inner1": {
              "type": "string",
              "defaultValue": null
            }
          }
        });

        var outer2 = JSON.parse(JSON.stringify(response.result.models.outer2));
        assert.deepEqual(outer2, {
          "id": "outer2",
          "type": "object",
            "properties": {
              "inner2": {
              "type": "string",
              "defaultValue": null
            }
          }
        });

        var foov1bar = JSON.parse(JSON.stringify(response.result.models.foov1bar));
        assert.deepEqual(foov1bar, {
          "id": "foov1bar",
          "type": "object",
          "properties": {
            "outer1": {
              "type": "outer1",
              "defaultValue": null
            },
            "outer2": {
              "type": "outer2",
              "defaultValue": null
            }
          }
        });

        done();
      });

    });

});
