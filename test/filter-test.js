var Lab             = require('lab'),
    Code            = require('code'),
    Helper          = require('../test/helper.js');

var lab     = exports.lab = Lab.script(),
    expect  = Code.expect;



lab.experiment('filter', function () {
    var routes = [{
            method: 'GET',
            path: '/actors',
            handler: Helper.defaultHandler,
            config: {
            tags: ['api']
            }
        },{
            method: 'GET',
            path: '/movies',
            handler: Helper.defaultHandler,
            config: {
            tags: ['api','a']
            }
        },{
            method: 'GET',
            path: '/movies/movie',
            handler: Helper.defaultHandler,
            config: {
            tags: ['api','b','a']
            }
        },{
            method: 'GET',
            path: '/movies/movie/actor',
            handler: Helper.defaultHandler,
            config: {
            tags: ['api','c']
            }
        }];
        
    
    lab.test('filter by tags=a', function (done) {
        
        Helper.createServer( {}, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json?tags=a'}, function(response) {
                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(countProperties(response.result.paths)).to.equal(2);
                done();
            });
            
        });
    });
    
    
   lab.test('filter by tags=a,c', function (done) {
        
        Helper.createServer( {}, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json?tags=a,c'}, function(response) {
                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(countProperties(response.result.paths)).to.equal(3);
                done();
            });
            
        });
    });
    
    
    lab.test('filter by tags=a,-b', function (done) {
        
        Helper.createServer( {}, routes, function(err, server){
            expect(err).to.equal(null);
            
            server.inject({method: 'GET', url: '/swagger.json?tags=a,-b'}, function(response) {
                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(countProperties(response.result.paths)).to.equal(1);
                done();
            });
            
        });
    });
    
    
    lab.test('filter by tags=a,+c', function (done) {
        
        Helper.createServer( {}, routes, function(err, server){
            expect(err).to.equal(null);
            
            // note %2B is a '+' plus char url encoded
            server.inject({method: 'GET', url: '/swagger.json?tags=a,%2Bb'}, function(response) {
                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(countProperties(response.result.paths)).to.equal(2);
                done();
            });
            
        });
    });
    
   
    
    lab.test('filter by tags=api,+a-b', function (done) {
        
        Helper.createServer( {}, routes, function(err, server){
            expect(err).to.equal(null);
            
            // note %2B is a '+' plus char url encoded
            server.inject({method: 'GET', url: '/swagger.json?tags=api,%2Ba,-b'}, function(response) {
                //console.log(JSON.stringify(response.result.paths));
                expect(response.statusCode).to.equal(200);
                expect(countProperties(response.result.paths)).to.equal(2);
                done();
            });
            
        });
    });
    
    
    

});





function countProperties( obj ){
    return Object.keys(obj).length;
}