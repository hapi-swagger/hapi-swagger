'use strict';
var Hoek                    = require('hoek'),
    Boom                    = require('boom'),
    Joi                     = require('joi');
	
    
var definitions = module.exports = {};	
	
    
/**
 * builds definition object in the JSON schema structure
 *
 * @param  {Object} parameters
 * @return {Object}
 */    
definitions.build = function( parameters ){
    
    var out = {
            'type': 'object',
            'properties': {}
        };

    // restructure path parameters to to JSON schema structure used in definitions
    for (var key in parameters) {
        if (parameters.hasOwnProperty(key)) {
            var obj = parameters[key];
            // move required to top level
            if( obj.required ){
                if(out.required === undefined){
                    out.required = [];
                }
                out.required.push(obj.name)
            }    
            out.properties[obj.name] = obj;
            // remove unneeded properties
            delete obj.name
            delete obj.required;
        }
    }

    return out;
}


/**
 * validates definition object, throws error on none valid structure
 *
 * @param  {Object} parameters
 * @return {Object}
 */ 
definitions.valid = function( definition ){
    
    
}


