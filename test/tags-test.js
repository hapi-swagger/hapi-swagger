var Lab             = require('lab'),
    Code            = require('code'),
    Hepler          = require('../test/helper.js');

var lab     = exports.lab = Lab.script(),
    expect  = Code.expect;



lab.experiment('tags', function () {
    var routes = [{
            method: 'GET',
            path: '/test',
            handler: Hepler.defaultHandler,
            config: {
            tags: ['api']
            }
        }];
        
    
    lab.test('no tag objects passed', function (done) {
        
        Hepler.createServer( {}, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                expect(response.result.tags).to.deep.equal([]);
                done();
            });
            
        });
    });
    
    
    lab.test('name property passed', function (done) {
        var swaggerOptions = {
            tags: [{
                "name": "test"
            }]
        }
        
        Hepler.createServer( swaggerOptions, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                expect(response.result.tags[0].name).to.equal('test');
                done();
            });
            
        });
    });
    
    
   lab.test('full tag object', function (done) {
        var swaggerOptions = {
            tags: [{
                "name": "test",
                "description": "Everything about test",
                "externalDocs": {
                    "description": "Find out more",
                    "url": "http://swagger.io"
                }
            }]
        }
        
        Hepler.createServer( swaggerOptions, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                expect(response.result.tags).to.deep.equal(swaggerOptions.tags);
                done();
            });
            
        });
    });


});