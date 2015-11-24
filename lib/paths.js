/*
 * Builds the swagger JSON file path section
 */


'use strict';
var Hoek                    = require('hoek'),
    Boom                    = require('boom'),
    Joi                     = require('joi'),
    ShortId                 = require('shortid'),
    Group                   = require('../lib/group'),
    Definitions             = require('../lib/definitions'),
    Properties              = require('../lib/properties'),
    Utilities               = require('../lib/utilities');
	
var paths = module.exports = {},
    internals = {};	
    

/**
 * build the swagger path section
 *
 * @param  {Object} setting
 * @param  {Object} routes
 * @return {Object}
 */		
paths.build = function( settings, routes ){
   
    var routesData = [];

    // loop each route
    routes.forEach(function (route) {
        
        // only include routes tagged with "api"
        if (!route.settings.tags || route.settings.tags.indexOf('api') < 0){
            return;
        } 
       
        var routeOptions = route.settings.plugins ? route.settings.plugins['hapi-swagger'] : {};
        var routeData = {
            path: route.path,
            method: route.method.toUpperCase(),
            description: route.settings.description,
            notes: route.settings.notes,
            authorizations: {},
            tags: Hoek.reach(route,'settings.tags'),
            queryParams: Hoek.reach(route,'settings.validate.query'),
            pathParams: Hoek.reach(route,'settings.validate.params'),
            payloadParams: Hoek.reach(route,'settings.validate.payload'),
            responseSchema: Hoek.reach(route,'settings.response.schema'),
            headerParams: Hoek.reach(route,'settings.validate.headers'),
            responses: routeOptions && routeOptions.responses || {},
            nickname: routeOptions && routeOptions.nickname || null,
            payloadType: routeOptions && routeOptions.payloadType || null,
            groups: route.group
        };


        // user configured interface through route plugin options
        if( Hoek.reach(routeOptions, 'validate.query') ){
            routeData.queryParams =  Properties.objectToArray( Hoek.reach(routeOptions, 'validate.query') );
        }
        if( Hoek.reach(routeOptions,'validate.params') ){
            routeData.pathParams =  Properties.objectToArray( Hoek.reach(routeOptions,'validate.params') );
        }
        if( Hoek.reach(routeOptions, 'validate.headers') ){
            routeData.headerParams =  Properties.objectToArray( Hoek.reach(routeOptions, 'validate.headers') );
        }
        if( Hoek.reach(routeOptions, 'validate.payload') ){
            // has different structure, just pass straight through
            routeData.payloadParams =  Hoek.reach(routeOptions, 'validate.payload' );
             // if its a native javascript object convert it to JOI
            if (!routeData.payloadParams.isJoi){
                routeData.payloadParams = Joi.object(routeData.payloadParams);
            }
        }


        if(route.settings.auth && settings.authorizations) {
            route.settings.auth.strategies.forEach(function(strategie) {
                if(settings.authorizations[strategie] && settings.authorizations[strategie].type){
                   routeData.authorizations[settings.authorizations[strategie].type] = settings.authorizations[strategie]
                }
            });
        }

        // hapi wildcard or array support for methods
        if(routeData.method === '*' || Array.isArray(routeData.method)){
            // OPTIONS not supported by Swagger and HEAD not support by HAPI
            var methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

            if(Array.isArray(routeData.method)){
                methods = routeData.method.filter(function( value ){
                    return (value.toUpperCase() !== "OPTIONS" || value.toUpperCase() !== "HEAD");
                });
            }

            methods.forEach(function (method) {
                var newRoute = Hoek.clone( routeData );
                newRoute.method = method.toUpperCase();;
                routesData.push(newRoute);
            });

        }else{
           routesData.push(routeData);
        }
    });
    
    //console.log(routesData);

    return paths.properties( settings, routesData);
   
}


/**
 * build the swagger path section
 *
 * @param  {Object} setting
 * @param  {Object} routes
 * @return {Object}
 */		
paths.properties = function( settings, routes ){
    
    var swagger = {definitions: {}},
        pathObj = {};
    
    routes.forEach(function (route, indexA) {
        
        //console.log(route.path,route.method)
        
        var path = route.path,
            method = route.method,
            out = {
                "summary": route.description, 
                "security":   Utilities.hasProperties(route.authorizations)? [route.authorizations] : [],
                "operationId": route.nickname || route.path.replace(/\//gi, '').replace(/\{/gi, '').replace(/\}/gi, ''),
                "description": route.notes,
                "parameters": []
            };
        
        // tags in swagger are used for grouping    
        if(route.groups){
            out.tags = route.groups;
        }

        out.description = Array.isArray(route.notes) ? route.notes.join('<br/><br/>') : route.notes;
        out.responses = Utilities.hasProperties(route.responses)? route.responses : {"200": {"description": "Successful"}};

 
        var payloadParameters;

        // set from plugin options or from route options
        var payloadType = settings.payloadType
        if(route.payloadType){
            payloadType = route.payloadType;
        }
        
        // build payload either with JSON or form input
        if (payloadType && payloadType.toLowerCase() === 'json') {
            
            
            // set as json
            payloadParameters = Properties.parseProperty(null, route.payloadParams, swagger.definitions);
            var definitionName = internals.getJOIClassName(route.payloadParams);
            //console.log(JSON.stringify(payloadParameters))
            
            // override inline structure and use defination object
            if(payloadParameters && payloadParameters.type !== 'void'){
                payloadParameters.in = 'body'
                payloadParameters.name = 'body'
                payloadParameters.schema = {'$ref': '#/definitions/' + Definitions.appendDefinition( 
                        definitionName, 
                        internals.getJOIObj(route, 'payloadParams'), 
                        swagger.definitions, 
                        out.operationId + '_payload'
                    )}
                delete payloadParameters.properties
                // set to JSON
                out.consumes = settings.consumes || ['application/json'];
                
            }
            
        } else {
            payloadParameters = Properties.joiToSwaggerParameters( internals.getJOIObj(route, 'payloadParams'), 'formData', swagger.definitions );
        }
        
         out.parameters = out.parameters.concat(
            Properties.joiToSwaggerParameters( internals.getJOIObj(route, 'headerParams'), 'header', swagger.definitions ),
            Properties.joiToSwaggerParameters( internals.getJOIObj(route, 'pathParams'), 'path', swagger.definitions ),
            Properties.joiToSwaggerParameters( internals.getJOIObj(route, 'queryParams'), 'query', swagger.definitions )
         );
        
        
        if(payloadParameters){
            out.parameters = out.parameters.concat( payloadParameters )
        }
        

        


        // set response type and definition
        // If the responseSchema is a joi object, response className can be set as an option:
        // Example: route.responseSchema = Joi.object({foo:Joi.string()}).options({className:"MyResponseClass"});

        var responseClassName = internals.getJOIClassName(route.responseSchema);
        if(responseClassName){
            if(!out.responses['200']){
                out.responses['200'] = {"description": "Successful"}
            }
            out.responses['200'].schema = {
                "$ref": "#/definitions/" + Definitions.appendDefinition( responseClassName, route.responseSchema, swagger.definitions)
            }
        }

        var responseProperty = Properties.parseProperty(
                responseClassName,
                internals.getJOIObj(route, 'responseSchema'),
                swagger.definitions,
                null
            );

        if (responseProperty) {
            //out.type = responseProperty.type || 'void';
            //if (out.type !== 'void') {
            //    out.produces = settings.produces;
            //}
            if(responseProperty.items) {
                // add these to the api operations
                out.items = responseProperty.items;
            }
        }
    

        if(!pathObj[path]){
            pathObj[path] = {};
        }
        pathObj[path][method.toLowerCase()] = out;
       

        //console.log(JSON.stringify(swagger.definitions))
    });
    
    swagger.paths = pathObj;
    return swagger
}













// gets the JOI object from route object
internals.getJOIObj = function (route, name) {
    var prama = route[name];

    if (route[name] && route[name].isJoi) {
        if (route[name]._inner.children) {
            prama = route[name]._inner.children;
        } else {
            // for array types
            if (route[name]._type = 'array') {
                prama = route[name];
            }
        }
    }

    return prama;
}


// get arg value of an item in arrays of structure
//   [ { name: 'name', arg: 'arg' } ]
// or from two arrays
//   ['name'] [ {'0': 'arg'} ]
internals.getArgByName = function (array, name, args) {
    if (!Array.isArray(array)) {
        return;
    }

    if (args) {
        var location = names.lastIndexOf(name);
        if (~location && args[location]) {
            return args[location]['0'];
        }
        return;
    }

    for (var i = array.length - 1; i >= 0; i--) {
        if (array[i].name === name) {
            return array[i].arg;
        }
    }
};


// get existance of an item in array of structure [ { name: 'name' } ]
internals.existsByName = function (array, name) {
    return array && array.some(function (v) {
        return v.name === name;
    });
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


