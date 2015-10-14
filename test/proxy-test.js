/*
Mocha test
This test was created for PR #159 
*/

var Chai            = require('chai'),
    Hapi            = require('hapi'),
    Joi             = require('joi'),
    Inert           = require('inert'),
    Vision          = require('vision'),
	  H2o2            = require('h2o2'),
    Wreck           = require('wreck'),
    HapiSwagger     = require('../lib/index.js');
    assert          = Chai.assert;


var defaultHandler = function(request, response) {
  reply('ok');
};


var replyWithJSON = function( err, res, request, reply, settings, ttl ){
    Wreck.read(res, { json: true }, function (err, payload) {
        reply(payload);
    });
}


describe('proxy test', function() {

    var server;


    var routes = [{
      method: 'POST',
      path: '/tools/microformats',
      config: {
        description:'parse microformats',
        tags: ['api'],        
        plugins: {
          'hapi-swagger': {
            payloadType: 'form',
            validate: {
              payload: {
                url: Joi.string().uri().required(),
                callback: Joi.string(),
                collapsewhitespace: Joi.boolean(),
                dateformat: Joi.any().allow(['auto', 'w3c', 'rfc3339', 'html5'])
              }
            }
          },
        },
        handler: {
          proxy: {
            host: 'glennjones.net',
            protocol: 'http',
            onResponse: replyWithJSON
          }
        }
      }
    },{
      method: 'POST',
      path: '/tools/microformats/',
      config: {
        description:'parse microformats',
        tags: ['api'],
        plugins: {
          'hapi-swagger': {
            nickname: 'microformatsapi',
            validate: {
              payload: {
                url: Joi.string().uri().required(),
                callback: Joi.string(),
                collapsewhitespace: Joi.boolean(),
                dateformat: Joi.any().allow(['auto', 'w3c', 'rfc3339', 'html5'])
              }
            }
          },
        },
        handler: {
          proxy: {
            host: 'glennjones.net',
            protocol: 'http',
            onResponse: replyWithJSON
          }
        }
      }
    }];



  beforeEach(function(done) {
    server = new Hapi.Server();
    server.connection();
    server.register([Inert, Vision, H2o2, HapiSwagger], function(err){
      server.start(function(err){
        server.route(routes);
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


    it('returned user built parameters', function(done) {
      server.inject({ method: 'GET', url: '/docs?path=tools '}, function (response) {
        //console.log(JSON.stringify(response.result.apis[0].operations[0].parameters));

        var optionClassModel = JSON.parse(JSON.stringify(response.result.apis[0].operations[0].parameters));
        assert.deepEqual(optionClassModel, [
            {
                "type": "string",
                "required": true,
                "name": "url",
                "paramType": "form"
            },
            {
                "type": "string",
                "defaultValue": null,
                "name": "callback",
                "paramType": "form"
            },
            {
                "type": "boolean",
                "defaultValue": null,
                "name": "collapsewhitespace",
                "paramType": "form"
            },
            {
                "type": "any",
                "defaultValue": null,
                "enum": [
                    "auto",
                    "w3c",
                    "rfc3339",
                    "html5"
                ],
                "name": "dateformat",
                "paramType": "form"
            }
        ]);
        done();
      });
    });
    
    
    
    it('returned user built model', function(done) {
      server.inject({ method: 'GET', url: '/docs?path=tools '}, function (response) {
        //console.log(JSON.stringify(response.result));

        var optionClassModel = JSON.parse(JSON.stringify(response.result.models));
        assert.deepEqual(optionClassModel, {
          "microformatsapi": {
              "id": "microformatsapi",
              "type": "object",
              "properties": {
                  "url": {
                      "type": "string",
                      "required": true
                  },
                  "callback": {
                      "type": "string",
                      "defaultValue": null
                  },
                  "collapsewhitespace": {
                      "type": "boolean",
                      "defaultValue": null
                  },
                  "dateformat": {
                      "type": "any",
                      "defaultValue": null,
                      "enum": [
                          "auto",
                          "w3c",
                          "rfc3339",
                          "html5"
                      ]
                  }
              }
          }
        });
        done();
      });
    });

/*


    it('return a classname based on path_method', function(done) {
      server.inject({ method: 'GET', url: '/docs?path=tools '}, function (response) {

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
    
    */

});
