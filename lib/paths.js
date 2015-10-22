'use strict';
var Hoek                    = require('hoek'),
    Boom                    = require('boom'),
    Joi                     = require('joi'),
    Group                   = require('../lib/group');
	
var paths = module.exports = {},
    internals = {};	
    
	
paths.build = function( options, request ){
    
    var routes = request.connection.table();
    
    var routesData = [];


    var tags = Group.byPath( options, routes );


    routes.forEach(function (route) {
        // only include routes tagged with "api"
        if (!route.settings.tags || route.settings.tags.indexOf('api') < 0) return;
        
       // console.log(route.path,route.method)

        var routeOptions = route.settings.plugins ? route.settings.plugins['hapi-swagger'] : {};
        var routeData = {
            group: route.group,
            path: route.path,
            method: route.method.toUpperCase(),
            description: route.settings.description,
            notes: route.settings.notes,
            authorizations: {},
            tags: route.settings.tags,
            queryParams: route.settings.validate && route.settings.validate.query,
            pathParams: route.settings.validate && route.settings.validate.params,
            payloadParams: route.settings.validate && route.settings.validate.payload,
            responseSchema: route.settings.response && route.settings.response.schema,
            headerParams: route.settings.validate && route.settings.validate.headers,
            responses: routeOptions && routeOptions.responses || [],
            nickname: routeOptions && routeOptions.nickname || null,
            payloadType: routeOptions && routeOptions.payloadType || null
        };

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

    return paths.properties( options, routesData);
    
    
}


paths.properties = function( settings, routes ){
    
    var swagger = {definitions: {}},
        pathObj = {};
    
    routes.forEach(function (route, indexA) {
        
        //console.log(route.path,route.method)
        
        var path = route.path,
            method = route.method,
            out = {
                "tags": route.group || [],
                "summary": route.description,
                "description": route.description,  
                "security": route.authorizations,
                "operationId": route.nickname || route.path.replace(/\//gi, '').replace(/\{/gi, '').replace(/\}/gi, ''),
                "notes": route.notes,
                "parameters": []
              
            };

        out.notes = Array.isArray(route.notes) ? route.notes.join('<br/><br/>') : route.notes;
        out.responses = route.responses;

        var pathParam = internals.getParams(route, 'pathParams')
        var queryParam = internals.getParams(route, 'queryParams')
        var headerParam = internals.getParams(route, 'headerParams')

        // build up swagger properties for route validation
        var pathProperties = internals.validatorsToProperties(pathParam, swagger.definitions);
        var queryProperties = internals.validatorsToProperties(queryParam, swagger.definitions);
        var headerProperties = internals.validatorsToProperties(headerParam, swagger.definitions);
        var payloadApiParams;

        // set globally or locally to route
        var payloadType = settings.payloadType
        if(route.payloadType){
            payloadType = route.payloadType;
        }

        if (payloadType && payloadType.toLowerCase() === 'json') {
            // set as json
            var payloadProperty = internals.validatorToProperty(out.nickname, route.payloadParams, swagger.definitions);
            if (payloadProperty && payloadProperty.type !== 'void') {
                payloadProperty.required = true;
                out.consumes = settings.consumes || ['application/json'];
            }
            payloadApiParams = internals.propertiesToAPIParams({
                body: payloadProperty
            }, 'body');
        } else {
            // set as form
            var payloadParam = internals.getParams(route, 'payloadParams')
            var payloadProperties = internals.validatorsToProperties(payloadParam, swagger.definitions);
            payloadApiParams = internals.propertiesToAPIParams(payloadProperties, 'form');
        }


        // add the path, query and body parameters
        out.parameters = out.parameters.concat(
            internals.propertiesToAPIParams(headerProperties, 'header'),
            internals.propertiesToAPIParams(pathProperties, 'path'),
            internals.propertiesToAPIParams(queryProperties, 'query'),
            payloadApiParams
        );

        // set response type and definition
        // If the responseSchema is a joi object, response className can be set as an option:
        // Example: route.responseSchema = Joi.object({foo:Joi.string()}).options({className:"MyResponseClass"});

        var responseClassName = internals._getClassName(route.responseSchema),
            altClassName = out.nickname + '_' + route.method + '_response';

        responseClassName = responseClassName || altClassName;

        var responseProperty = internals.validatorToProperty(
                responseClassName,
                internals.getParams(route, 'responseSchema'),
                swagger.definitions,
                null
            );

        if (responseProperty) {
            out.type = responseProperty.type || 'void';
            if (out.type !== 'void') {
                out.produces = settings.produces;
            }
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



// gets the pramas from route object
internals.getParams = function (route, name) {
    var prama = route[name];

    if (route[name] && route[name].isJoi) {
        if (route[name]._inner.children) {
            prama = route[name]._inner.children;
        } else {
            // fix for responseObject array types
            if (route[name]._type = 'array') {
                prama = route[name];
            }
        }
    }

    return prama;
}


// convert an object of properties to an api parameter array
internals.propertiesToAPIParams = function (properties, type) {
    if (properties === null ||
        properties === undefined ||
        (typeof properties !== 'object')) {
        return [];
    }

    var params = [];
    var keys = Object.keys(properties);
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var param = properties[key];
        if (!param) {
            continue;
        }
        param.name = key;
        param.in = type;
        if (param.type === "array") {
            param.allowMultiple = true;
        }
        params.push(param);
    }

    return params;
};


// convert an object of Joi validators into an object of swagger schema properties
internals.validatorsToProperties = function (params, definitions, requiredArray) {
    var i,
        x,
        key,
        param,
        properties = {};

    if (params === null ||
        params === undefined ||
        (typeof params !== 'object')) {
        return [];
    }

    if (params.isJoi && params._inner.children) {
        params = params._inner.children
    }

    if (Array.isArray(params)) {
        i = params.length,
            x = 0;
        while (x < i) {
            key = params[x].key;
            param = params[x].schema;
            properties[key] = internals.validatorToProperty(key, param, definitions, requiredArray);
            x++;
        }
    }

    return properties;
};

internals._getClassName = function(schema) {
    if(schema && schema._meta && Array.isArray(schema._meta)){
        var i = schema._meta.length;
        while (i--) {
            if(schema._meta[i].className){
                return schema._meta[i].className
            }
        }
    }
    return undefined;
}


// decode a Joi validator into swagger schema property
internals.validatorToProperty = function (name, param, definitions, requiredArray) {
    if (param === null ||
        param === undefined) {
        return undefined;
    }

    // removes forbidden properties
    if (param._flags
        && param._flags.presence
        && param._flags.presence === 'forbidden'){
            return undefined;
    }


    var property = {
        type: 'void'
    };

    // if given a plain object, create a definition and return that
    if (typeof param.validate !== 'function') {
        property.type = internals.validatorsToDefinitionName(name, param, definitions);
        return property;
    }

    if (param.describe) {
        var describe = param.describe();
        property.type = param._type.toLowerCase();
        property.description = typeof param._description === 'string' ? param._description : undefined;
        property.notes = typeof param._notes !== 'function' && param._notes.length ? param._notes : undefined;
        property.tags = typeof param._tags !== 'function' && param._tags.length ? param._tags : undefined;
        //property.defaultValue = (describe.flags) ? describe.flags.default : null;

        if (param._flags && param._flags.presence) {
            property.required = (param._flags.presence === 'required') ? true : false;
        }

        // add enum values if not only undefined or null
        if (Array.isArray(describe.valids) && describe.valids.length) {
            var enums = describe.valids.filter(function (v) {
                return v !== undefined && v !== '';
            });
            if (enums.length) {
                property["enum"] = enums;
            }
        }

        if (property.type === 'number') {
            property.minimum = internals.getArgByName(describe.rules, 'min');
            property.maximum = internals.getArgByName(describe.rules, 'max');
            if (internals.existsByName(describe.rules, 'integer')) {
                property.type = 'integer';
            }
        }

        if (property.type === 'object' && param._inner) {
            var className = internals._getClassName(param);
            var param = (param._inner.children) ? param._inner.children : param._inner
            property.type = internals.validatorsToDefinitionName(
                    className || name || property.description,
                param,
                definitions);
        }

        if (property.type === 'array') {
            property.minItems = internals.getArgByName(describe.rules, 'min');
            property.maxItems = internals.getArgByName(describe.rules, 'max');

            var arrayTypes = param._inner ? param._inner.inclusions : internals.getArgByName(describe.rules, 'includes');
            // swagger appears to only support one array type at a time, so lets grab the first one
            var firstInclusionType = internals.first(arrayTypes);

            if (firstInclusionType) {
                // get className of embeded array
                if(name === 'items'
                    && Hoek.reach(param, '_inner.inclusions.0._meta')
                    && Array.isArray(param._inner.inclusions[0]._meta)){

                    var meta = param._inner.inclusions[0]._meta,
                        i = meta.length;
                    while (i--) {
                        if(meta[i].className){
                            name = meta[i].className
                        }
                    }
                }


                var arrayProperty = internals.validatorToProperty(name, firstInclusionType, definitions);

                if (arrayProperty['enum']) {
                    property.items = {
                        'type': arrayProperty.type,
                        'enum': arrayProperty['enum']
                    };
                } else {
                    if(arrayProperty.type === 'string'){
                        property.items = {
                            'type': arrayProperty.type
                        };
                    }else{
                        property.items = {
                            '$ref': arrayProperty.type
                        };
                    }

                }
            }
        }

        if (property.type === 'any') {
            var i = param._meta.length;
            while (i--) {
                if(param._meta[i].swaggerType
                    && param._meta[i].swaggerType === 'file'){
                    property.type = "file";
                    property.in = "body";
                }
            }
        }

    }

    // if a required array is present use that for required fields instead of a flag
    if (requiredArray) {
        if (property.required) {
            requiredArray.push(name);
        }
        delete property.required;
    }

    return property;
};



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



// create a definition from an object of Joi validators. Return the definition name
internals.validatorsToDefinitionName = function (name, params, definitions) {

    // if no name create a signature
    if (!name) {
        name = 'definition_' + ShortId.generate();
    }

    // need to either create new object or comparision
    var definition = internals.createDefinition(name, params, definitions);

    // find existing definition by this name
    var foundDefinition = definitions[name];
    if (foundDefinition) {

        // deep compare object
        if(Hoek.deepEqual(foundDefinition, definition)){
            // return existing id
            return foundDefinition.id;
        }else{
            // create new definition with alt name, to stop reuse of definition
            definition.id = 'definition_' + ShortId.generate();
            definitions[definition.id] = definition;
        }
    }else{
        // create new definition
        definitions[name] = definition;
    }

    return definition.id;
};


// creates a new definition
internals.createDefinition = function (name, params, definitions) {
    return {
        "type": "object",
        "properties": internals.validatorsToProperties(params, definitions)
    };
}


internals.first = function first(array) {
    return array ? array[0] : undefined;
};
