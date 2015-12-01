/*
  Checks that the use of payloads with deep child structures is passed into swaggers UI
  */


var Lab             = require('lab'),
    Code            = require('code'),
    Joi            	= require('joi'),
	  Helper          = require('../test/helper.js');

var lab     = exports.lab = Lab.script(),
    expect  = Code.expect;


lab.experiment('child-models', function () {
  
   var requestOptions = {
    method: 'GET',
    url: '/swagger.json',
    headers: {
      host: 'localhost'
    }
  };
  
  var routes = {
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
      };
  
  
  
  lab.test('child', function (done) {

      Helper.createServer( {}, routes, function(err, server){
          server.inject(requestOptions, function(response) {
            expect(err).to.equal(null);
              //console.log(JSON.stringify(response.result));
              expect(response.statusCode).to.equal(200);
              expect(response.result.paths['/foo/v1/bar'].post.parameters[0].schema).to.deep.equal({
                    "$ref": "#/definitions/foov1bar_payload"
                });
              expect(response.result.definitions.foov1bar_payload).to.deep.equal({
                    "properties": {
                        "outer1": {
                            "properties": {
                                "inner1": {
                                    "type": "string"
                                }
                            }
                        },
                        "outer2": {
                            "properties": {
                                "inner2": {
                                    "type": "string"
                                }
                            }
                        }
                    },
                    "type": "object"
                });
              done();
          });
      });
  });
    
  
  
});


