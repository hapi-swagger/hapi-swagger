

var Hapi 			= require('hapi'),
    swagger         = require('../'),
    pack            = require('../package'),
	routes 			= require('./mock-routes');

var server = new Hapi.Server(3004);
server.route(routes);


// setup swagger options
var swaggerOptions = {
    basePath: 'http://localhost:3004',
    apiVersion: pack.version
};



server.pack.register(require('../'), function(err) {
	if(err){
		console.log(['error'], 'plugin "hapi-swagger" load error: ' + err) 
	}else{
		console.log(['start'], 'swagger interface loaded')
		server.start(function(){
            console.log(['start'], pack.name + ' - web interface: ' + server.info.uri);
        });
	}
});