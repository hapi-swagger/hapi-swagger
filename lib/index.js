var Hoek            = require('hoek'),
    Boom            = require('boom'),
    Joi             = require('joi'),
    Path            = require('path');

// Declare internals

var internals = {
    defaults: {
        endpoint: '/docs',
        auth: false,
        basePath: '',
        pathPrefixSize: 1,
    }
};

var SwaggerNoteData = {
    "error status codes": { tag: "responseMessages", toEnd: true },
    "responseClass": {tag: "responseClass", toEnd: false },
}

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
                path: Joi.string(),
                api_key: Joi.string()
            }
        },
        handler: function (request, reply) {

            var requestSettings = Hoek.clone(settings);

            // prepend full protocol, hostname and port onto endpoints for shred
            var protocol = request.server.info.protocol || 'http';
            var hostname = protocol + '://' + request.headers.host;
            if(!requestSettings.endpoint.match(/^https?:\/\//)) {
                requestSettings.endpoint = hostname + settings.endpoint;
            }
            if(!requestSettings.basePath.match(/^https?:\/\//)) {
                requestSettings.basePath = hostname + settings.basePath;
            }

            var routes = (request.server.routingTable)? request.server.routingTable(): request.server.table(),
                resourceName = request.query.path;


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
                return reply(Boom.notFound());
            }


            // sort routes a-z
            routes.sort(function (route1, route2) {
                if (route1.path < route2.path) return -1;
                if (route1.path > route2.path) return 1;
                return 0;
            });


            // build documentation API endpoint for each route group
            if (request.query.path) {
                var apiData = internals.getRoutesData(routes);
                apiData.path = routes[0] ? routes[0].path : '/';
                return reply(internals.buildAPIInfo( requestSettings, apiData, request.query.path)).type('application/json; charset=utf-8');
            }


            // build documentation API discovery endpoint
            return reply(internals.buildAPIDiscovery( requestSettings, routes )).type('application/json; charset=utf-8');

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


// filters route objects into simpler more useful form
internals.getRoutesData = function (routes) {
    var routesData = [];
    routes.forEach(function (route) {
        // only include routes tagged routes
        if(!route.settings.tags || route.settings.tags.indexOf('api') < 0) return;

        routesData.push({
            path: route.path,
            method: route.method.toUpperCase(),
            description: route.settings.description,
            notes: route.settings.notes,
            tags: route.settings.tags,
            queryParams: internals.getParamsData(route.settings.validate && route.settings.validate.query),
            payloadParams: internals.getParamsData(route.settings.validate && route.settings.validate.payload),
            pathParams: internals.getParamsData(route.settings.validate && route.settings.validate.path),
            responseParams: internals.getParamsData(route.settings.response && route.settings.response.schema)
        });
    });
    return { routes: routesData };
};


// build documentation API discovery endpoint
internals.buildAPIDiscovery = function( settings, routes ){
    var i = routes.length,
        x = 0,
        parts,
        prefix,
        apis = [],
        swagger = {
            "apiVersion": "unknown",
            "swaggerVersion": "1.2",
            "basePath": settings.endpoint + '?path=',
            "apis": []
        };

        if(settings.apiVersion){
            swagger.apiVersion = settings.apiVersion;
        }


    while (x < i) {
        var route = routes[x]
        if(route.settings.tags && route.settings.tags.indexOf('api') > -1){
            parts = route.path.split('/');
            prefix = internals._commonPrefix(settings, route.path);
            // only add a group once base on the starting path segment
            if(apis.indexOf(prefix) === -1){
                swagger.apis.push({
                    "path": prefix
                })
                apis.push(prefix);
            }
        }
        x++;
    }

    return swagger;
};

internals._commonPrefix = function( settings, path ){
    var i = 0,
    path_head = [],
    prefix,
    parts;
    parts = path.split('/');
    while (parts.length > 0) {
        var item = parts.shift();
        if (item !== '') {
            path_head.push(item);
            // only count when it's a path element (and not the initial /)
            i++;
        }
        if (i >= settings.pathPrefixSize) {
            break;
        }
    }
    prefix = path_head.join('/');
    return prefix;
}

internals.hapi2Swag = function( responseInfo, responseFilter ) {
    var required = [];
    var model = {};
    var properties = {};
    responseInfo.forEach( function ( item ) {
        if (responseFilter.some( function(i) { return (i === item.name) } )) {
            return;
        }
        if (item.required) {
            required.push(item.name);
        }
        properties[item.name] = {type: item.type, required: item.required};
    });
    model = {properties: properties, required: required};

    return model;
}

// build documentation API endpoint for each route group
internals.buildAPIInfo = function( settings, apiData, slug ){
    var parts,
        swagger = {
            "apiVersion": "unknown",
            "swaggerVersion": "1.2",
            "basePath": settings.basePath,
            "resourcePath": '/' + slug,
            "apis": [],
            "models": {}
        };

        if(settings.apiVersion){
            swagger.apiVersion = settings.apiVersion;
        }

        apiData.routes.forEach(function (route, indexA) {
        var notesStatus = internals.getResponseMessages( route.notes ),
            api = {
                "path": route.path,
                "description": route.description,
                "operations": [{
                    "httpMethod": route.method,
                    "summary": route.description,
                    "nickname": route.path.replace(/\//gi,'').replace(/{/gi,'').replace(/}/gi,''),
                    "notes": notesStatus.notes,
                    "responseClass": notesStatus.notesExtra.responseClass || "void"
                }]
            };

        if( notesStatus.notesExtra.responseMessages.length > -1 ) {
            api.operations[0].responseMessages = notesStatus.notesExtra.responseMessages;
        }

        try {
            var response_info = route.responseParams;
            if (response_info) {
                var response_filter = settings.responseFilter || [];
                var response_class = notesStatus.notesExtra.responseClass;
                var model_data = internals.hapi2Swag(response_info, response_filter);
                model_data['id'] = response_class;
                model_data['description'] = route.description;
                swagger.models[response_class] = model_data;
            }
        } catch (err) {
            console.log("error in converting model to Swagger");
            console.log(err);
        }

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
        
        if(param.describe){
            // version 2.x of HAPI
            var describe = param.describe();
            paramsData.push({
                name: key,
                description: typeof param._description === 'function' ? '' : param._description,
                notes: typeof param._notes === 'function' ? '' : param._notes,
                tags: typeof param._tags === 'function' ? '' : param._tags,
                type: param._type,
                required: (describe.valids && describe.valids.indexOf(undefined) !== -1)? false : true
            });    
        }else{
            // pre version 2.x of HAPI
            paramsData.push({
                name: key,
                description: typeof param.description === 'function' ? '' : param.description,
                notes: typeof param.notes === 'function' ? '' : param.notes,
                tags: typeof param.tags === 'function' ? '' : param.tags,
                type: param.type,
                required: param.__modifiers && param.__modifiers._values ? param.__modifiers._values.some(internals.isRequiredParam) : null,
            });
        }
        
    }
    return paramsData;
};

internals.processErrorStatusCodes = function ( noteSlice ) {
    var responseMessages = [],
        items,
        num;
    noteSlice.forEach( function (note) {
        if( note.indexOf(',') === -1 ) {
            return;
        }
        items = note.split(',');
        if( isNaN(items[0]) === true ){
            return;
        }
        num = parseInt( items[0] );
        if( num > 99 && num < 600){
            responseMessages.push({
                'code': num,
                'message': internals.trim(items[1])
            });
        }
    });
    return responseMessages;
}

internals.getResponseMessages = function( notes ){
    var out = { 
        notes:[], 
        notesExtra: {}
    };
    var notesLen = notes.length,
        x = 0,
        hasCodes = false,
        currLine,
        currTag,
        itemData;

    // in case notes is a string
    if (typeof notes === 'string') {
        notes = [ notes ];
        notesLen = 1;
    }

    Object.keys(SwaggerNoteData).map( function (t) { out.notesExtra[SwaggerNoteData[t].tag] = []; });
    while (x < notesLen) {
        currLine = internals.trimLower( notes[x] );
        itemData = undefined;
        currTag = '';
        Object.keys(SwaggerNoteData).forEach( function (ttxt) {
            var txt = ttxt.toLowerCase();
            if ( currLine.indexOf(txt) > -1 ) {
                itemData = SwaggerNoteData[ttxt];
                currTag = ttxt;
            }
        });
        if (itemData === undefined) {
            out.notes.push(notes[x]);
            x += 1;
            continue;
        }

        if(itemData.toEnd){
            var res = internals.processErrorStatusCodes( notes.slice(x, notesLen) );
            out.notesExtra.responseMessages = res;
            break;
        } else {
            var re = RegExp(currTag+':?(\\s*)(.*)$', 'i');
            var data = re.exec(notes[x])[2]; // the 2nd group is the data we want
            out.notesExtra[SwaggerNoteData[currTag].tag] = data;
            x += 1;
        }

    }
    console.log( JSON.stringify(out) );
    return out;
}

internals.trimLower = function (str) {
    return internals.trim (str.toLowerCase());
}

internals.trim = function (str) {
    return str.replace(/^\s+|\s+$/g, "");
}


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
