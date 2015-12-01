
/*
 * Builds the swagger JSON file responses section
 */


'use strict';
var Hoek                    = require('hoek'),
    Boom                    = require('boom'),
    Joi                     = require('joi');
    
var Definitions             = require('../lib/definitions'),
    Utilities               = require('../lib/utilities');

	
var responses = module.exports = {},	
    internals = {};	






responses.build = function(  responses, defaultSchema, statusSchemas, definitions ){
  var out = {};
  
  // add defaultSchema to statusSchemas if needed
  if(defaultSchema && (!statusSchemas || !statusSchemas[200])){
     statusSchemas[200] = defaultSchema;
  }
  
  if(statusSchemas){
      // loop for each status and convert schema into a definition
      for (var key in statusSchemas) {
          if (statusSchemas.hasOwnProperty(key)) {
              var responseClassName = internals.getJOIClassName(statusSchemas[key]);
              out[key] = {
                description: Hoek.reach(statusSchemas[key], '_description')
              };
              out[key].headers = internals.getMetaProperty( statusSchemas[key], 'headers' );
              out[key].example = internals.getMetaProperty( statusSchemas[key], 'example' );
              
              // only add schema if object has children
              if( internals.hasJoiObjectChildren(statusSchemas[key]) ){
                out[key] = {
                  schema: {
                    '$ref': '#/definitions/' + Definitions.appendDefinition( responseClassName, statusSchemas[key], definitions)
                  }
                };
              }
              out[key] = Utilities.deleteEmptyProperties( out[key] )
          }
      }  
  }else{
      // add default Successfulif we still have no responses
      out[200] = {
        "schema": {
            'type': 'string'
        },
        'description': 'Successful'
     }
  }
  
  // use plug-in overrides to enchance hapi objects and properties
  if(Utilities.hasProperties(responses)){
     out = internals.override( out, responses, definitions );
  }
  return Utilities.deleteEmptyProperties( out );
}


internals.hasJoiObjectChildren =  function( joiObj ){
  return(joiObj._inner.children === null)? false : true;
}




internals.getMetaProperty = function( joiObj, propertyName ){
   // get headers added using meta function
    if(Hoek.reach(joiObj, '_meta')
        && Array.isArray(joiObj._meta)){

        var meta  = joiObj._meta,
            i     = meta.length;
        while (i--) {
            if(meta[i][propertyName]){
                return meta[i][propertyName]
            }
        }
    } 
    return null;
}



internals.override = function( out, responses, definitions ){
    // convert all JOI objects into Swagger defination references
    for (var key in responses) {
      if (responses.hasOwnProperty(key)) {
        if(Hoek.reach(responses[key],'schema.isJoi') && responses[key].schema.isJoi === true){
          var responseClassName = internals.getJOIClassName(responses[key].schema);
          responses[key].schema = {
            '$ref': '#/definitions/' + Definitions.appendDefinition( responseClassName, responses[key].schema, definitions)
          }
        }
      }
      out[key] = responses[key];
    }
    
    return out;
}


/**
 * given a JOI schema get its className
 *
 * @param  {Object} joiObj
 * @return {String || undefined}
 */		
internals.getJOIClassName = function(joiObj) {
    if (joiObj && joiObj._meta && Array.isArray(joiObj._meta)){
        var i = joiObj._meta.length;
        while (i--) {
            if (joiObj._meta[i].className){
                return joiObj._meta[i].className
            }
        }
    }
    return undefined;
}
