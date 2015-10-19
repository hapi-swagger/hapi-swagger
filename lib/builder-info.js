'use strict';
var Hoek                    = require('hoek'),
    Boom                    = require('boom'),
    Joi                     = require('joi');

	
    var info = module.exports = {};	
    
    // default data for info
    info.defaults = {
        title: 'API documentation'
    }
    
    // schema for info
    info.schema = Joi.object({
        title: Joi.string().required(),
        description: Joi.string(),
        termsOfService: Joi.string(),
        contact: Joi.object({
            name: Joi.string(),
            url: Joi.string().uri(),
            email: Joi.string().email(),
        }),
        license: Joi.object({
            name: Joi.string(),
            url: Joi.string().uri(),
        }),
        version: Joi.string()
    });
    
    
    /**
        * build the swagger info section
        *
        * @param  {Object} options
        * @return {Object}
        */	
    info.build = function( options ){
        
        var out = {};
        out = Hoek.applyToDefaults(info.defaults, options.info);
        
        console.log(JSON.stringify(out))
        Joi.assert(out, info.schema);
        
        return out;
        
        /*
        return {
            "description": "This is a sample server Petstore server.  You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).  For this sample, you can use the api key `special-key` to test the authorization filters.",
            "version": "1.0.0",
            "title": "Swagger Petstore",
            "termsOfService": "http://swagger.io/terms/",
            "contact": {
                "email": "apiteam@swagger.io"
            },
            "license": {
                "name": "Apache 2.0",
                "url": "http://www.apache.org/licenses/LICENSE-2.0.html"
            }
        };
        */
        
    }