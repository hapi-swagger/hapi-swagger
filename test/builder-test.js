var Hapi            = require('hapi'),
    Joi             = require('joi'),
    Inert           = require('inert'),
    Vision          = require('vision'),
    Lab             = require('lab'),
    Code            = require('code')
    HapiSwagger     = require('../lib/index.js');

var lab     = exports.lab = Lab.script(),
    expect  = Code.expect;



lab.experiment('info', function () {
    var routes = [{
            method: 'GET',
            path: '/test',
            handler: defaultHandler,
            config: {
            tags: ['api']
            }
        }];
        
    
    lab.test('no info object passed', function (done) {
        createServer( {}, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                expect(response.result.info).to.deep.equal({title: 'API documentation'});
                done();
            });
            
        });
    });
    
    
    lab.test('min valid info object', function (done) {
        var swaggerOptions = {
            info: {title: 'test title for lab'}
        }
        
        createServer( swaggerOptions, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                expect(response.result.info).to.deep.equal(swaggerOptions.info);
                done();
            });
            
        });
    });
    
    
   lab.test('full info object', function (done) {
        var swaggerOptions = {
            info: {
                "title": "Swagger Petstore",
                "description": "This is a sample server Petstore server.",
                "version": "1.0.0",
                "termsOfService": "http://swagger.io/terms/",
                "contact": {
                    "email": "apiteam@swagger.io"
                },
                "license": {
                    "name": "Apache 2.0",
                    "url": "http://www.apache.org/licenses/LICENSE-2.0.html"
                }
            }
        }
        
        createServer( swaggerOptions, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                expect(response.result.info).to.deep.equal(swaggerOptions.info);
                done();
            });
            
        });
    });


});



/**
    * creates a Hapi server
    *
    * @param  {Object} swaggerOptions
    * @param  {Object} routes
    * @param  {Function} callback
    */	
    function createServer( swaggerOptions, routes, callback){
        var err = null,
            server = new Hapi.Server();
            
        server.connection();
        server.register([
            Inert, 
            Vision, 
            {
                register: HapiSwagger,
                options: swaggerOptions
            }
            ], function(err){
            server.start(function(err){
                if(err){
                    callback(err, null);
                }
            });
            
        });
        
        server.route(routes);
        callback(err, server); 
    }
    
    
/**
    * a handler function used to mock a response
    *
    * @param  {Object} swaggerOptions
    * @param  {Object} routes
    * @param  {Function} callback
    */	    
    function defaultHandler(request, reply) {
        reply('ok');
    };
    
