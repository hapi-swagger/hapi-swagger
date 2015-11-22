/*
 * Builds the swagger JSON file definitions section
 */


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
    var out = definitions.createObject(),
        props = definitions.createProperties( parameters );
   
    // merge in properties and required structures      
    out = Hoek.merge(props, out);
    
    return out;
}



/**
 * builds basic definition object
 *
 * @return {Object}
 */ 
definitions.createObject = function(){
    return {
        'type': 'object',
        'properties': {}
    };
}


/**
 * builds definition object properties structure
 *
 * @param  {Object} parameters
 * @return {Object}
 */    
definitions.createProperties = function(  parameters  ){
    var out = {
        properties: {}
    };
    
    for (var key in parameters) {

        var obj = parameters[key];
        // move required to top level
        if( obj.required ){
            if(out.required === undefined){
                out.required = [];
            }
            out.required.push(obj.name)
        }
        
        // remove properties with undefined values
        for (var objkey in obj) {
            if(obj[objkey] === undefined){
                delete obj[objkey];
            }
        }
        //console.log( JSON.stringify(obj) );
        if(obj.type === 'object'){
           out.properties[obj.name] = definitions.createProperties( obj ); 
        }else{
           out.properties[obj.name] = obj; 
        }

        
        // remove unneeded properties
        delete obj.name
        delete obj.required;
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


