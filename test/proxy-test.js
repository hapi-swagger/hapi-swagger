/*
 * Use with proxies, tests the different way schemes, host and basePath can be set
 */

var Lab             = require('lab'),
    Code            = require('code'),
    Joi            	= require('joi'),
    Wreck           = require('wreck'),
	  Helper          = require('../test/helper.js');

var lab     = exports.lab = Lab.script(),
    expect  = Code.expect;



lab.experiment('proxies', function () {

  var requestOptions = {
    method: 'GET',
    url: '/swagger.json',
    headers: {
      host: 'localhost'
    }
  };
  
  var routes = {
      method: 'GET',
      path: '/test',
      handler: Helper.defaultHandler,
      config: {
        tags: ['api']
      }
    };



  lab.test('basePath option', function (done) {
     var options = {
        basePath: '/v2'
      }
    
      Helper.createServer( options, routes, function(err, server){
          server.inject(requestOptions, function(response) {
            expect(err).to.equal(null);
              //console.log(JSON.stringify(response.result));
              expect(response.statusCode).to.equal(200);
              expect(response.result.basePath).to.equal(options.basePath);
              done();
          });
      });
  });
    
    
  lab.test('schemes and host options', function (done) {
      var options = {
        schemes: ['https'],
        host: 'testhost'
      }
    
      Helper.createServer( options, routes, function(err, server){
          server.inject(requestOptions, function(response) {
              expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
              expect(response.result.host).to.equal(options.host);
              expect(response.result.schemes).to.deep.equal(options.schemes);
              done();
          });
      });
  });
  
  
  lab.test('x-forwarded options', function (done) {
      var options = {}
      
      requestOptions.headers = {
          'x-forwarded-host': 'proxyhost',
          'x-forwarded-proto': 'https'
      };
    
      Helper.createServer( options, routes, function(err, server){
          server.inject(requestOptions, function(response) {
              expect(err).to.equal(null);
              //console.log(JSON.stringify(response.result));
              expect(response.result.host).to.equal(requestOptions.headers['x-forwarded-host']);
              expect(response.result.schemes).to.deep.equal(['https']);
              done();
          });
      });
  });



  lab.test('adding facade for proxy using route options', function (done) {


      routes = {
          method: 'POST',
          path: '/tools/microformats/',
          config: {
              description:'parse microformats',
              tags: ['api'],
              plugins: {
                  'hapi-swagger': {
                      nickname: 'microformatsapi',
                      validate: {
                          params: {
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
      }
      
      Helper.createServer( {}, routes, function(err, server){
          server.inject(requestOptions, function(response) {
              expect(err).to.equal(null);
              //console.log(JSON.stringify(response.result.paths['/tools/microformats/'].post.parameters));
              expect(response.result.paths['/tools/microformats/'].post.parameters).to.deep.equal([
                  {
                      "type": "string",
                      "required": true,
                      "name": "url",
                      "in": "path"
                  },
                  {
                      "type": "string",
                      "name": "callback",
                      "in": "path"
                  },
                  {
                      "type": "boolean",
                      "name": "collapsewhitespace",
                      "in": "path"
                  },
                  {
                      "type": "any",
                      "enum": [
                          "auto",
                          "w3c",
                          "rfc3339",
                          "html5"
                      ],
                      "name": "dateformat",
                      "in": "path"
                  }
              ]);
              done();
          });
      });

  });

  
  lab.test('adding facade for proxy using route options', function (done) {

      routes = {
          method: 'POST',
          path: '/tools/microformats/',
          config: {
              tags: ['api'],
              plugins: {
                  'hapi-swagger': {
                      nickname: 'microformatsapi',
                      validate: {
                          payload: {
                            testpayload: Joi.string()
                          },
                          query: {
                            testquery: Joi.string()
                          },
                          params: {
                            testparam: Joi.string()
                          },
                          headers: {
                            testheaders: Joi.string()
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
      }
      
      Helper.createServer( {}, routes, function(err, server){
          server.inject(requestOptions, function(response) {
              expect(err).to.equal(null);
              //console.log(JSON.stringify(response.result.paths['/tools/microformats/'].post.parameters));
              expect(response.result.paths['/tools/microformats/'].post.parameters).to.deep.equal([
                {
                    "type": "string",
                    "name": "testheaders",
                    "in": "header"
                },
                {
                    "type": "string",
                    "name": "testparam",
                    "in": "path"
                },
                {
                    "type": "string",
                    "name": "testquery",
                    "in": "query"
                },
                {
                    "in": "body",
                    "name": "body",
                    "description": "order placed for purchasing the pet",
                    "required": true,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "testpayload": {
                                "type": "string"
                            }
                        }
                    }
                }
            ]);
              done();
          });
      });

  });

  
});


function replyWithJSON( err, res, request, reply, settings, ttl ){
    Wreck.read(res, { json: true }, function (err, payload) {
        reply(payload);
    });
}
