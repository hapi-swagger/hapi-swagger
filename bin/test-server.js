var Hapi            = require('hapi'),
    Inert           = require('inert'),
    Vision          = require('vision'),
    Blipp           = require('blipp'),
    HapiSwagger     = require('../'),
    Pack            = require('../package'),
	Routes 			= require('./mock-routes');

var server = new Hapi.Server();
server.connection({ 
        host: 'localhost', 
        port: 3000 
    });

var swaggerOptions = {
        apiVersion: Pack.version
    };

server.register([
    Inert,
    Vision,
    Blipp,
    {
        register: HapiSwagger,
        options: swaggerOptions
    }], function (err) {
        server.start(function(){
            console.log('server running at:', server.info.uri);
        });
    });
    
server.route(Routes);

