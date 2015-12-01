/*
 * Builds the swagger JSON file definitions section
 */


'use strict';
var Hoek                    = require('hoek'),
    Boom                    = require('boom'),
    Joi                     = require('joi'),
    Properties              = require('../lib/properties');
	
    
var definitions = module.exports = {},
    internals = {};	


/**
 * creates a new definition object
 *
 * @param  {Object} joiObj
 * @param  {Object} definitions
 * @return {Object}
 */		
definitions.createDefinition = function (joiObj, definitions) {
    // TODO changes this to new method
    var properties = Properties.parseProperties(joiObj, definitions);
    var propertyArray = Properties.propertiesObjToArray(properties, null);
    return this.build( propertyArray );
}


definitions.appendDefinition = function (name, joiObj, collection, altName) {

    // create definition object
    var definition = this.createDefinition(joiObj, collection);

    // find existing definition by this name
    var foundDefinition = collection[name];
    if (foundDefinition) {
        // deep compare objects
        if(Hoek.deepEqual(foundDefinition, definition)){
            // return existing name if existing object is exactly the same
            return name;
        }else{
            // create new definition with altName
            // to stop reuse of definition with same name but different structures
           collection[altName] = definition;
           return altName;
        }
    }else{
        // create new definition
        collection[name || altName] = definition;
        return [name || altName];
    }
};



/**
 * Given a JOI schema get its className
 *
 * @param  {Object} joiObj
 * @return {String || undefined}
 */		
internals.getJOIClassName = function(joiObj) {
    if(joiObj && joiObj._meta && Array.isArray(joiObj._meta)){
        var i = joiObj._meta.length;
        while (i--) {
            if(joiObj._meta[i].className){
                return joiObj._meta[i].className
            }
        }
    }
    return undefined;
}

	
    
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
    
    //console.log(JSON.stringify(parameters ))
    
    for (var key in parameters) {

        var obj = parameters[key];
        
        // move required to top level
        if( obj.required ){
            if(out.required === undefined){
                out.required = [];
            }
            out.required.push(obj.name || key)
        }
        
        // remove properties with undefined values
        for (var objkey in obj) {
            if(obj[objkey] === undefined){
                delete obj[objkey];
            }
        }
        
        // recurse into child objects
        if(obj.type === 'object' && obj.properties){
           out.properties[obj.name] = definitions.createProperties( obj.properties ); 
        }else{
           // if child has no name use its key
           out.properties[obj.name || key] = obj; 
        }
        //out.type = 'object';

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


