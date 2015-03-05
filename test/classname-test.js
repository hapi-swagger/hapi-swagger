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


describe('meta className test', function() {

    var server;

    var schema1 = Joi.object({
       _id: Joi.any().required(),
       name: Joi.string().required()
    }).meta({
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
    }).meta({
       className: 'deletedUser'
    });

    var routes = [
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
    ];



    beforeEach(function(done) {
      server = new Hapi.Server();
      server.connection({ host: 'test' });
      server.route( routes );
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


    it('returned meta based classname', function(done) {
      server.inject({ method: 'GET', url: '/docs?path=test '}, function (response) {
        //console.log(JSON.stringify(response.result));

        var optionCLassModel = JSON.parse(JSON.stringify(response.result.models.User));
        assert.deepEqual(optionCLassModel, {
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
        done();
      });
    });




    it('return a classname based on path_method', function(done) {
      server.inject({ method: 'GET', url: '/docs?path=test '}, function (response) {

        var pathMethodModel = JSON.parse(JSON.stringify(response.result.models.testmethodid_GET_response));
        //console.log(JSON.stringify(pathMethodModel));

        assert.deepEqual(pathMethodModel, {
            "id": "testmethodid_GET_response",
            "type": "object",
            "properties": {
                "methodGet": {
                    "type": "string",
                    "required": true
                }
            }
        });
        done();
      });
    });


    it('return a shortid based classname', function(done) {
      server.inject({ method: 'GET', url: '/docs?path=test '}, function (response) {

        var name = response.result.apis[4].operations[0].type;
        //console.log(name)

        var shortidModel = JSON.parse(JSON.stringify(response.result.models[name]));
        //console.log(JSON.stringify(shortidModel));

        assert.deepEqual(shortidModel, {
            "id": name,
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
