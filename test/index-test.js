var Hapi            = require('hapi'),
    Inert           = require('inert'),
    Vision          = require('vision'),
    HapiSwagger     = require('../lib/index.js'),
    Lab             = require('lab'),
    Code            = require('code'),
    Joi             = require('joi'),
    Helper          = require('../test/helper.js');

var lab     = exports.lab = Lab.script(),
    expect  = Code.expect;



lab.experiment('index', function () {

    var routes = [{
		method: 'POST',
		path: '/store/',
		config: {
			handler: Helper.defaultHandler,
			tags: ['api'],
			validate: { 
				payload: {
					a: Joi.number(),
					b: Joi.number(),
					operator: Joi.string(),
					equals: Joi.number()
				}
			}
		}
    }];
    
    
    lab.test('plug-in register no vision dependency', function (done) {
   
        try{
            var server = new Hapi.Server();
            server.connection();
            server.register([
                Inert,
                HapiSwagger
                ], function(err){
                server.start(function(err){
                });
            });
            server.route(routes);
        }catch(err){
             expect(err.message).to.equal('Missing vision plug-in registation');
             done();
        }
 

     });
     
     
     lab.test('plug-in register no inert dependency', function (done) {
   
        try{
            var server = new Hapi.Server();
            server.connection();
            server.register([
                Vision,
                HapiSwagger
                ], function(err){
                server.start(function(err){
                });
            });
            server.route(routes);
        }catch(err){
             expect(err.message).to.equal('Missing inert plug-in registation');
             done();
        }

     });
     
     
    lab.test('plug-in register no options', function (done) {
   
        var server = new Hapi.Server();
        server.connection();
        server.register([
            Inert, 
            Vision, 
            HapiSwagger
            ], function(err){
            server.start(function(err){
                expect(err).to.equal(undefined);
                done();
            });
        });
        server.route(routes);

     });
    
    
        
    
    lab.test('plug-in register test', function (done) {
        
        Helper.createServer( {}, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(countProperties(response.result.paths)).to.equal(1);
                done();
            });
            
        });
    });
    
    
    Helper.createServer( {}, routes, function(err, server){
        expect(err).to.equal(null);
        
        lab.test('default jsonPath url', function (done) {
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        }); 
        
        lab.test('default documentationPath url', function (done) {
            server.inject({method: 'GET', url: '/documentation'}, function(response) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
        
        lab.test('default swaggerUIPath url', function (done) {
            server.inject({method: 'GET', url: '/swaggerui/swagger-ui.js'}, function(response) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
        
    });
    
   
    var swaggerOptions = {
        'jsonPath': '/test.json',
        'documentationPath': '/testdoc',
        'swaggerUIPath': '/testui/' 
    }
    
    
    Helper.createServer( swaggerOptions, routes, function(err, server){
        expect(err).to.equal(null);
        
        lab.test('repathed jsonPath url', function (done) {
            server.inject({method: 'GET', url: '/test.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        }); 
        
        lab.test('repathed documentationPath url', function (done) {
            server.inject({method: 'GET', url: '/testdoc'}, function(response) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
        
        lab.test('repathed swaggerUIPath url', function (done) {
            server.inject({method: 'GET', url: '/testui/swagger-ui.js'}, function(response) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
        
    });
    
    
    lab.test('disable documentation path', function (done) {
        var swaggerOptions = {
           'enableDocumentationPage': false
        }
        
        Helper.createServer( swaggerOptions, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/documentation'}, function(response) {
                expect(response.statusCode).to.equal(404);
                done();
            });  
        });
    });
    
    
    lab.test('payloadType = form global', function (done) {
        var swaggerOptions = {
           'payloadType': 'json'
        }
        
        Helper.createServer( swaggerOptions, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                //console.log(JSON.stringify(response.result));
                expect(response.result.paths['/store/'].post.parameters.length).to.equal(1);
                expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('body');
                done();
            });

        });
    });
    
    
    lab.test('payloadType = json global', function (done) {
        var swaggerOptions = {
           'payloadType': 'form'
        }
        
        Helper.createServer( swaggerOptions, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                //console.log(JSON.stringify(response.result));
                expect(response.result.paths['/store/'].post.parameters.length).to.equal(4);
                expect(response.result.paths['/store/'].post.parameters[0].name).to.equal('a');
                done();
            });

        });
    });
    
    
    lab.test('pathPrefixSize global', function (done) {
        var swaggerOptions = {
           'pathPrefixSize': 2,
        }
        
        var prefixRoutes = [{
            method: 'GET',
            path: '/foo/bar/extra',
            config: {
                handler: Helper.defaultHandler,
                tags: ['api'],
            }
        }];
        
        Helper.createServer( swaggerOptions, prefixRoutes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                expect(response.result.paths['/foo/bar/extra'].get.tags[0]).to.equal('foo/bar');
                done();
            });

        });
    });
    
    
    lab.test('expanded none', function (done) {
        // TODO find a way to test impact of property change
        Helper.createServer( {'expanded': 'none'}, routes, function(err, server){
            expect(err).to.equal(null);
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
     });
        
        
    lab.test('expanded list', function (done) {    
        Helper.createServer( {'expanded': 'list'}, routes, function(err, server){
            expect(err).to.equal(null);
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
     });
        
        
    lab.test('expanded full', function (done) {   
        Helper.createServer( {'expanded': 'full'}, routes, function(err, server){
            expect(err).to.equal(null);
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        }); 
    });
    
    
    lab.test('pass through of tags querystring', function (done) {
        Helper.createServer( {}, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/documentation?tags=reduced'}, function(response) {
                expect(response.statusCode).to.equal(200);
                expect(response.result.indexOf('swagger.json?tags=reduced') > -1).to.equal(true);
                done();
            });
            
        });
    });
    
    
 

});


function countProperties( obj ){
    return Object.keys(obj).length;
}