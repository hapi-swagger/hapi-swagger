var Lab             = require('lab'),
    Code            = require('code'),
    Helper          = require('../test/helper.js');


var lab     = exports.lab = Lab.script(),
    expect  = Code.expect;



lab.experiment('info', function () {
    var routes = [{
            method: 'GET',
            path: '/test',
            handler: Helper.defaultHandler,
            config: {
            tags: ['api']
            }
        }];
        
    
    lab.test('defaults for swagger root object properties', function (done) {
        
        Helper.createServer( {}, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                
                expect(response.result.swagger).to.equal('2.0');
                expect(response.result.schemes).to.deep.equal(['http']);
                expect(response.result.basePath).to.equal('/');
                expect(response.result.consumes).to.deep.equal(['application/json']);
                expect(response.result.produces).to.deep.equal(['application/json']);
                
               // expect(response.result.host).to.equal(server.info.host);
                
                //console.log(response.result.host)
                //console.log(JSON.stringify(server.info));
                //console.log(JSON.stringify(response.result));
                
 
                done();
            });
            
        });
    });
    
    
    lab.test('set values for swagger root object properties', function (done) {
        
        var swaggerOptions = {
            'swagger': '5.9.45',
            'schemes': ['https'],
            'basePath': '/base',
            'consumes': ['application/xml'],
            'produces': ['application/xml'],
            'externalDocs': {
                'description': 'Find out more about HAPI',
                'url': 'http://hapijs.com'
            }
        }
        
        Helper.createServer( swaggerOptions, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json'}, function(response) {
                expect(response.statusCode).to.equal(200);
                
                //console.log(JSON.stringify(response.result))
                
                expect(response.result.swagger).to.equal('2.0');
                expect(response.result.schemes).to.deep.equal(['https']);
                expect(response.result.basePath).to.equal('/base');
                expect(response.result.consumes).to.deep.equal(['application/xml']);
                expect(response.result.produces).to.deep.equal(['application/xml']);
                expect(response.result.externalDocs).to.deep.equal(swaggerOptions.externalDocs);
                
                done();
            });
            
        });
    });
    

});



