var Hoek            = require('hoek'),
    Boom            = require('boom'),
    Joi             = require('joi'),
    Path            = require('path');

// Declare internals

var internals = {
    defaults: {
        endpoint: '/docs',
        auth: false,
        basePath: ''
    }
};


exports.register = function (plugin, options, next) {

    var settings = Hoek.applyToDefaults(internals.defaults, options || {});


    // add routing for documentation API endpoint ie /docs
    plugin.route({ 
        method: 'GET', 
        path: settings.endpoint, 
        config: internals.docs(settings) 
    });

    // add routing for swaggerui library directory ie /docs/swaggerui
    plugin.route({
        method: 'GET',
        path: settings.endpoint + '/{path*}',
        handler: { directory: { path: __dirname + '/../public', listing: true, index: false } }
    });

    next();
};


internals.docs = function (settings) {

    return {
        auth: settings.auth,
        validate: {
            query: {
                path: Joi.types.String(),
                api_key: Joi.types.String()
            }
        },
        handler: function (request) {

            var routes = request.server.routingTable();

            // if we have a resource name filter routes    
            if(resourceName){
                // remove routes that do not belong to the resource
                routes = routes.filter(function (item) {
                    if( item.method !== 'options'
                        && internals.isResourceRoute(item.path, resourceName)){
                        return true
                    }
                    return false
                });
            }


            // return 404 if no routes are found
            if (!routes.length) {
                return request.reply(Boom.notFound());
            }


            // sort routes a-z
            routes.sort(function (route1, route2) {
                return route1.path > route2.path;
            });


            // build documentation API endpoint for each route group
            if (request.query.path) {
                var apiData = internals.getRoutesData(routes);
                apiData.path = routes[0] ? routes[0].path : '/';
                return request.reply(internals.buildAPIInfo( settings, apiData, request.query.path)).type('application/json; charset=utf-8');
            }


            // build documentation API discovery endpoint
            return request.reply(internals.buildAPIDiscovery( settings, routes )).type('application/json; charset=utf-8');

        },
        plugins: {
            "hapi-swagger": false
        }
    };
};


// is route path part of the resource
// Based on pull request by David Waterston  - http://jsfiddle.net/davidwaterston/cC4v8/
internals.isResourceRoute = function (routePath, resourceName) {
    if (routePath 
        && resourceName 
        && routePath.search('^/' + resourceName + '(/|$)') === 0 ) {
            return true;
    }
    return false;
};



internals.getRoutesData = function (routes) {
    var routesData = [];
    routes.forEach(function (route) {
        routesData.push({
            path: route.path,
            method: route.method.toUpperCase(),
            description: route.settings.description,
            notes: route.settings.notes,
            tags: route.settings.tags,
            queryParams: internals.getParamsData(route.settings.validate && route.settings.validate.query),
            payloadParams: internals.getParamsData(route.settings.validate && route.settings.validate.payload),
            pathParams: internals.getParamsData(route.settings.validate && route.settings.validate.path),
            responseParams: internals.getParamsData(route.settings.validate && route.settings.validate.response && route.settings.validate.response.schema)
        });
    });
    return { routes: routesData };
};



// build documentation API discovery endpoint
internals.buildAPIDiscovery = function( settings, routes ){
    var i = routes.length,
        x = 0,
        parts,
        apis = [],
        swagger = {
            "apiVersion": "unknown",
            "swaggerVersion": "1.1",
            "basePath": settings.basePath,
            "apis": []
        };

        if(settings.apiVersion){
            swagger.apiVersion = settings.apiVersion;
        }


    while (x < i) {
        var route = routes[x]
        if(route.settings.tags && route.settings.tags.indexOf('api') > -1){
            parts = route.path.split('/');

            // only add a group once base on the starting path segment
            if(apis.indexOf(parts[1]) === -1){
                swagger.apis.push({
                    "path": '/docs?path=' + parts[1],
                    "description": route.settings.description
                })
                apis.push(parts[1]);
            }
        }
        x++;
    }

    return swagger;
}


// build documentation API endpoint for each route group
internals.buildAPIInfo = function( settings, apiData, slug ){
    var parts,
        swagger = {
            "apiVersion": "unknown",
            "swaggerVersion": "1.1",
            "basePath": settings.basePath,
            "resourcePath": '/' + slug,
            "apis": []
        };

        if(settings.apiVersion){
            swagger.apiVersion = settings.apiVersion;
        }

        apiData.routes.forEach(function (route, indexA) {
        var api = {
                "path": route.path,
                "description": route.description,
                "operations": [{
                    "httpMethod": route.method,
                    "summary": route.description,
                    "nickname": route.path.replace(/\//gi,'').replace(/{/gi,'').replace(/}/gi,''),
                    "notes": route.notes,
                    "responseClass": "void"
                }]
            };

        // add the query parameters
        api.operations[0].parameters = [];
        if(route.pathParams){
            route.pathParams.forEach(function (param, indexB) {
                api.operations[0].parameters.push(convertParam(param, 'path'))
            })
        }
        if(route.payloadParams){
            route.payloadParams.forEach(function (param, indexB) {
                api.operations[0].parameters.push(convertParam(param, 'payload'))
            })
        }
        if(route.queryParams ){
            route.queryParams.forEach(function (param, indexB) {
                api.operations[0].parameters.push(convertParam(param, 'query'))
            })
        }


        swagger.apis.push(api) 
    });

    return swagger;
}


function convertParam(param, type){
   var p = {
            "name": param.name,
            "description": param.description,
            "paramType": type,
            "required": param.required,
            "allowMultiple": false,
            "dataType": param.type.toLowerCase()
        }
    if(param.type === "Array"){
        p.allowMultiple = true;
    }
    return p;
}



// get details from route object
internals.getParamsData = function (params) {

    if (params === null ||
        params === undefined ||
        (typeof params !== 'object')) {
        return [];
    }

    var paramsData = [];
    var keys = Object.keys(params);
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var param = params[key];
        paramsData.push({
            name: key,
            description: typeof param.description === 'function' ? '' : param.description,
            notes: typeof param.notes === 'function' ? '' : param.notes,
            tags: typeof param.tags === 'function' ? '' : param.tags,
            type: param.type,
            required: param.__modifiers && param.__modifiers._values ? param.__modifiers._values.some(internals.isRequiredParam) : null,
            allowedValues: param.__valids ? internals.getExistsValues(param.__valids._exists) : null,
            disallowedValues: param.__invalids ? internals.getExistsValues(param.__invalids._exists) : null
        });
    }
    return paramsData;
};



internals.getExistsValues = function (exists) {
    var values = [];
    var keys = Object.keys(exists);
    keys.forEach(function (key) {
        key = key.substring(1, key.length - 1);
        if (key !== 'ndefine' && key !== 'ul' && key.length !== 0) {
            values.push(key);
        }
    });
    return values;
};


internals.isRequiredParam = function (element) {
    return element === 'required';
};


exports._internals = internals;
