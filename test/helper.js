var Hapi            = require('hapi'),
    Inert           = require('inert'),
    Vision          = require('vision'),
    H2o2            = require('h2o2'),
    HapiSwagger     = require('../lib/index.js');
    
    
    var helper = module.exports = {};   
    
    /**
    * creates a Hapi server
    *
    * @param  {Object} swaggerOptions
    * @param  {Object} routes
    * @param  {Function} callback
    */	
    helper.createServer = function( swaggerOptions, routes, callback){
        var err = null,
            server = new Hapi.Server();
            
        server.connection();
        server.register([
            Inert, 
            Vision,
            H2o2, 
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
    helper.defaultHandler = function(request, reply) {
        reply('ok');
    };
    