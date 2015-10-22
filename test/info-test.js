var Lab             = require('lab'),
    Code            = require('code'),
    Hepler          = require('../test/helper.js');

var lab     = exports.lab = Lab.script(),
    expect  = Code.expect;



lab.experiment('info', function () {
    var routes = [{
            method: 'GET',
            path: '/test',
            handler: Hepler.defaultHandler,
            config: {
            tags: ['api']
            }
        }];
        
    
    lab.test('no info object passed', function (done) {
        
        Hepler.createServer( {}, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                expect(response.result.info).to.deep.equal({"title": "API documentation"});
                done();
            });
            
        });
    });
    
    
    lab.test('no info title property passed', function (done) {
        
        var swaggerOptions = {
            info: {}
        }
        
        Hepler.createServer( swaggerOptions, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                expect(response.result.info).to.deep.equal({"title": "API documentation"});
                done();
            });
            
        });
    });
    
    
    
    lab.test('min valid info object', function (done) {
        var swaggerOptions = {
            info: {title: 'test title for lab'}
        }
        
        Hepler.createServer( swaggerOptions, routes, function(err, server){
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
        
        Hepler.createServer( swaggerOptions, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                expect(response.result.info).to.deep.equal(swaggerOptions.info);
                done();
            });
            
        });
    });


});