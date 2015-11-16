var Hapi            = require('hapi'),
    Inert           = require('inert'),
    Vision          = require('vision'),
    Blipp           = require('blipp'),
    HapiSwagger     = require('../'),
    Pack            = require('../package'),
	Routes 			= require('./routes');

var server = new Hapi.Server();
server.connection({ 
        host: 'localhost', 
        port: 3000 
    });

var swaggerOptions = {
         info: {
            'title': 'Test API Documentation',
            'description': 'This is a sample example of API documentation.',
            'version': Pack.version,
            'termsOfService': 'https://github.com/glennjones/hapi-swagger/',
            'contact': {
                'email': 'glennjonesnet@gmail.com'
            },
            'license': {
                'name': 'MIT',
                'url': 'https://raw.githubusercontent.com/glennjones/hapi-swagger/master/license.txt'
            }
        },
        tags: [{
            "name": "store",
            "description": "Storing a sum",
            "externalDocs": {
                "description": "Find out more",
                "url": "http://example.org"
            }
        }]
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

