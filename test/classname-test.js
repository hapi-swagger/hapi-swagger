/*
Mocha test
This test was created for issue #95
*/

var chai = require('chai'),
   Hapi = require('hapi'),
   Joi = require('joi'),
   assert = chai.assert;

var defaultHandler = function(request, response) {
  reply('ok');
};


describe('options className test', function() {

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


    it('modified response schema should be returned', function(done) {

      var schema1 = Joi.object({
         _id: Joi.any().required(),
         name: Joi.string().required()
      }).options({
         className: 'User'
      });

      var schema2 = schema1.keys({
          name: Joi.string().optional()
      })

      var schemaGet = Joi.object({
         methodGet: Joi.string().required()
      })

      var schemaPost = Joi.object({
         methodpost: Joi.string().required()
      })

      var schemaDelete = Joi.object({
         methoddelete: Joi.string().required()
      }).options({
         className: 'deletedUser'
      });

      server.route([
        {
          method: 'GET',
          path: '/test/one',
          handler: defaultHandler,
          config: {
            tags: ['api'],
            response: {schema : schema1}
          }
        }, {
          method: 'GET',
          path: '/test/two',
          handler: defaultHandler,
          config: {
            tags: ['api'],
            response: {schema : schema2}
          }
        }, {
          method: 'GET',
          path: '/test/method/{id}',
          handler: defaultHandler,
          config: {
            tags: ['api'],
            response: {schema : schemaGet}
          }
        }, {
          method: 'POST',
          path: '/test/method/{id}',
          handler: defaultHandler,
          config: {
            tags: ['api'],
            response: {schema : schemaPost}
          }
        }, {
          method: 'DELETE',
          path: '/test/method/{id}',
          handler: defaultHandler,
          config: {
            tags: ['api'],
            response: {schema : schemaDelete}
          }
        }
      ]);



      server.inject({ method: 'GET', url: '/docs?path=test '}, function (response) {
        //console.log(JSON.stringify(response.result.models));

        var userModel = JSON.parse(JSON.stringify(response.result.models.User));
        assert.deepEqual(userModel, {
          "id": "User",
          "type": "object",
          "properties": {
              "_id": {
                  "type": "any",
                  "required": true
              },
              "name": {
                  "type": "string",
                  "required": true
              }
          }
        });

        var testtwoModel = JSON.parse(JSON.stringify(response.result.models.testtwo_GET_response));
        assert.deepEqual(testtwoModel, {
          "id": "testtwo_GET_response",
          "type": "object",
          "properties": {
              "_id": {
                  "type": "any",
                  "required": true
              },
              "name": {
                  "type": "string",
                  "required": false
              }
          }
        });





        done();
      });

    });

});
