var Hoek = require('hoek'),
    Boom = require('boom'),
    Joi = require('joi'),
    Path = require('path');

// Declare internals

var internals = {
    defaults: {
        protocol: null, // If not specified, uses the same protocol as server info
        endpoint: '/docs',
        auth: false,
        basePath: '',
        pathPrefixSize: 1,
        payloadType: 'json',
        produces: ['application/json'],
        ui: true,
        listing: true,
        index: false
    }
};


exports.register = function(plugin, options, next) {

    var settings = Hoek.applyToDefaults(internals.defaults, options || {});


    // add routing for documentation API endpoint ie /docs
    plugin.route({
        method: 'GET',
        path: settings.endpoint,
        config: internals.docs(settings)
    });

    if (settings.ui) {

        plugin.views({
            engines: {
                html: {
                    module: require('handlebars')
                }
            },
            path: __dirname + '/../public/swaggerui'
        });

        plugin.route({
            method: 'GET',
            path: settings.endpoint + '/swaggerui/index.html',
            handler: {
                view: {
                    template: 'index.html',
                    context: {
                        settings: settings
                    }
                }
            }
        });

        // add routing for swaggerui library directory ie /docs/swaggerui
        plugin.route({
            method: 'GET',
            path: settings.endpoint + '/swaggerui/{path*}',
            handler: {
                directory: {
                    path: __dirname + '/../public/swaggerui/',
                    listing: settings.listing,
                    index: settings.index
                }
            }
        });


    }
    next();
};


internals.docs = function(settings) {

    return {
        auth: settings.auth,
        validate: {
            query: {
                path: Joi.string(),
                tags: Joi.string(),
                api_key: Joi.string()
            }
        },
        handler: function(request, reply) {

            var requestSettings = Hoek.clone(settings);

            // prepend full protocol, hostname and port onto endpoints for shred
            var protocol = requestSettings.protocol || request.server.info.protocol || 'http';
            var hostname = protocol + '://' + request.headers.host;
            if (!requestSettings.basePath.match(/^https?:\/\//)) {
                requestSettings.basePath = hostname + settings.basePath;
            }
            if (!requestSettings.endpoint.match(/^https?:\/\//)) {
                requestSettings.endpoint = requestSettings.basePath + settings.endpoint;
            }

            var routes = (request.server.routingTable) ? request.server.routingTable() : request.server.table(),
                resourceName = request.query.path;


            // if we have a resource name filter routes
            if (resourceName) {
                // remove routes that do not belong to the resource
                routes = routes.filter(function(item) {
                    if (item.method !== 'options' && internals.isResourceRoute(item.path, resourceName)) {
                        return true;
                    }
                    return false;
                });
            }

            // Remove routes without the specified tags if any is specified
            if (request.query.tags) {
                tags = request.query.tags.split(',');
                routes = routes.filter(function(route) {
                    if (!route.settings.tags || Hoek.intersect(route.settings.tags, tags).length > 0) {
                        return true;
                    }
                    return false;
                });
            }

            // return 404 if no routes are found
            if (!routes.length) {
                return reply(Boom.notFound());
            }


            // sort routes a-z
            routes.sort(function(route1, route2) {
                if (route1.path < route2.path) return -1;
                if (route1.path > route2.path) return 1;
                return 0;
            });


            // build documentation API endpoint for each route group
            if (request.query.path) {
                var apiData = internals.getRoutesData(routes);
                apiData.path = routes[0] ? routes[0].path : '/';
                return reply(internals.buildAPIInfo(requestSettings, apiData, request.query.path)).type('application/json; charset=utf-8');
            }


            // build documentation API discovery endpoint
            return reply(internals.buildAPIDiscovery(requestSettings, routes, request.query.tags)).type('application/json; charset=utf-8');

        },
        plugins: {
            "hapi-swagger": false
        }
    };
};


// is route path part of the resource
// Based on pull request by David Waterston  - http://jsfiddle.net/davidwaterston/cC4v8/
internals.isResourceRoute = function(routePath, resourceName) {
    if (routePath &&
        resourceName &&
        routePath.search('^/' + resourceName + '(/|$)') === 0) {
        return true;
    }
    return false;
};


// filters route objects into simpler more useful form
internals.getRoutesData = function(routes) {
    var routesData = [];

    routes.forEach(function(route) {
        // only include routes tagged routes
        if (!route.settings.tags || route.settings.tags.indexOf('api') < 0) return;

        routesData.push({
            path: route.path,
            method: route.method.toUpperCase(),
            description: route.settings.description,
            notes: route.settings.notes,
            tags: route.settings.tags,
            queryParams: route.settings.validate && route.settings.validate.query,
            pathParams: route.settings.validate && route.settings.validate.path,
            payloadParams: route.settings.validate && route.settings.validate.payload,
            responseSchema: route.settings.response && route.settings.response.schema
        });
    });

    return {
        routes: routesData
    };
};


// build documentation API discovery endpoint
internals.buildAPIDiscovery = function(settings, routes, tags) {
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

    // pass through tags to restrict endpoint display
    if(tags){
       swagger.basePath =  settings.endpoint + '?tags=' + tags + '&path='
    }    

    if (settings.apiVersion) {
        swagger.apiVersion = settings.apiVersion;
    }


    while (x < i) {
        var route = routes[x];
        if (route.settings.tags && route.settings.tags.indexOf('api') > -1) {
            parts = route.path.split('/');
            prefix = internals._commonPrefix(settings, route.path);
            // only add a group once base on the starting path segment
            if (apis.indexOf(prefix) === -1) {
                swagger.apis.push({
                    "path": prefix
                });
                apis.push(prefix);
            }
        }
        x++;
    }

    return swagger;
};

internals._commonPrefix = function(settings, path) {
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
};

// build documentation API endpoint for each route group
internals.buildAPIInfo = function(settings, apiData, slug) {
    var parts;
    var swagger = {
        "apiVersion": "unknown",
        "swaggerVersion": "1.2",
        "basePath": settings.basePath,
        "resourcePat11h": '/' + slug,
        "apis": [],
        "models": {}
    };

    if (settings.apiVersion) {
        swagger.apiVersion = settings.apiVersion;
    }

    apiData.routes.forEach(function(route, indexA) {
        var api = {
            "path": route.path,
            "description": route.description,
            "operations": [{
                "method": route.method,
                "summary": route.description,
                "nickname": route.path.replace(/\//gi, '').replace(/\{/gi, '').replace(/\}/gi, ''),
                "notes": route.notes,
                "type": 'void',
                "parameters": []
            }]
        };

        var op = api.operations[0];

        var notesStatus = internals.getResponseMessages(route.notes);
        if (notesStatus.responseMessages.length > -1) {
            op.responseMessages = notesStatus.responseMessages;
            op.notes = notesStatus.notes;
        }

        // build up swagger properties for route validation
        var pathProperties = internals.validatorsToProperties(route.pathParams && route.pathParams.isJoi ?
                                                              route.pathParams._inner : route.pathParams,
                                                              swagger.models);
        var queryProperties = internals.validatorsToProperties(route.queryParams && route.queryParams.isJoi ?
                                                               route.queryParams._inner : route.queryParams, 
                                                               swagger.models);
        var payloadApiParams;

        if (settings.payloadType === 'json') {
            var payloadProperty = internals.validatorToProperty(op.nickname, route.payloadParams, swagger.models);

            if (payloadProperty && payloadProperty.type !== 'void') {
                payloadProperty.required = true;
                // set body type
                op.consumes = ['application/json'];
            }
            payloadApiParams = internals.propertiesToAPIParams({
                body: payloadProperty
            }, 'body');
        } else {
            var payloadProperties = internals.validatorsToProperties(route.payloadParams && route.payloadParams.isJoi ?
                                                                     route.payloadParams._inner : route.payloadParams, 
                                                                     swagger.models);
            payloadApiParams = internals.propertiesToAPIParams(payloadProperties, 'form');
        }

        // add the path, query and body parameters
        op.parameters = op.parameters.concat(
            internals.propertiesToAPIParams(pathProperties, 'path'),
            internals.propertiesToAPIParams(queryProperties, 'query'),
            payloadApiParams
        );

        // set response type and model
        // If the responseSchema is a joi object, response className can be set as an option:
        // Example: route.responseSchema = Joi.object({foo:Joi.string()}).options({className:"MyResponseClass"});

        var responseClassName = route.responseSchema && route.responseSchema._settings ? 
                route.responseSchema._settings.className || route.responseSchema._settings.typeName : undefined;

        var responseProperty = internals.validatorToProperty(responseClassName || op.nickname + '_response', 
                                                             route.responseSchema, swagger.models);
        if (responseProperty) {
            op.type = responseProperty.type || 'void';
            if (op.type !== 'void') {
                op.produces = settings.produces;
            }
        }

        swagger.apis.push(api);
    });

    return swagger;
};

// convert an object of properties to an api parameter array
internals.propertiesToAPIParams = function(properties, type) {
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
        param.paramType = type;
        if (param.type === "array") {
            param.allowMultiple = true;
        }
        params.push(param);
    }

    return params;
};


// convert an object of Joi validators into an object of swagger schema properties
internals.validatorsToProperties = function(params, models, requiredArray) {

    if (params === null ||
        params === undefined ||
        (typeof params !== 'object')) {
        return [];
    }

    // fixes for version >= 3.x of Joi
    if(params.isJoi){
        params = params._inner
    }

    var properties = {};
    var keys = Object.keys(params);
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var param = params[key];

        properties[key] = internals.validatorToProperty(key, param, models, requiredArray);
    }
    return properties;
};

// decode a Joi validator into swagger schema property
internals.validatorToProperty = function(name, param, models, requiredArray) {
    if (param === null ||
        param === undefined) {
        return undefined;
    }

    if (typeof param !== 'object') {
        throw new Error('Invalid validator for ' + name + ': ' + (typeof param));
    }

    var property = {
        type: 'void'
    };

    // if given a plain object, create a model and return that
    if (typeof param.validate !== 'function') {
        property.type = internals.validatorsToModelName(name, param, models);
        return property;
    }

    if (param.describe) {
        // version >= 2.x/3.x of Joi
        var describe = param.describe();

        property.type = param._type.toLowerCase();
        property.required = (describe.valids && describe.valids.indexOf(undefined) !== -1) ? false : true;
        property.description = typeof param._description === 'string' ? param._description : undefined;
        property.notes = typeof param._notes !== 'function' && param._notes.length ? param._notes : undefined;
        property.tags = typeof param._tags !== 'function' && param._tags.length ? param._tags : undefined;

        // add enum values if not only undefined or null
        if (Array.isArray(describe.valids) && describe.valids.length) {
            var enums = describe.valids.filter(function(v) {
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

        // version >= 2.x of Joi
        if (property.type === 'object' && param._children) {
            property.type = internals.validatorsToModelName(
                param._settings.className || param._settings.typeName || property.description,
                param._children,
                models);
        }

        // version >= 3.x of Joi
        if (property.type === 'object' && param._inner) {
            var className = param._settings ? param._settings.className || param._settings.typeName : undefined;
            property.type = internals.validatorsToModelName(
                className || property.description,
                param._inner,
                models);
        }


        if (property.type === 'array') {
            property.minItems = internals.getArgByName(describe.rules, 'min');
            property.maxItems = internals.getArgByName(describe.rules, 'max');
            // swagger appears to only support one array type at a time, so lets grab the first one
            var arrayTypes = internals.getArgByName(describe.rules, 'includes');
            if (arrayTypes && arrayTypes[0]) {
                var arrayProperty = internals.validatorToProperty(name, arrayTypes[0], models);
                if (arrayProperty.$ref) {
                    property.items = {
                        $ref: arrayProperty.$ref
                    };
                } else {
                    property.items = {
                        type: arrayProperty.type,
                        'enum': arrayProperty['enum']
                    };
                }
            }
        }

    } else {

        // pre version 2.x of Joi
        property.type = param.type.toLowerCase();
        property.required = param.__modifiers && internals.existsByName(param.__modifiers._values, 'required');
        property.description = typeof param.description === 'string' ? param.description : undefined;
        property.notes = typeof param.notes !== 'function' ? param.notes : undefined;
        property.tags = typeof param.tags !== 'function' ? param.tags : undefined;

        // add enum values if not only undefined or null
        if (param.__valids && Array.isArray(param.__valids._values) && param.__valids._values.length) {
            var enums = param.__valids._values.filter(function(v) {
                return v !== undefined;
            });
            if (enums.length) {
                property["enum"] = enums;
            }
        }

        if (property.type === 'number') {
            property.minimum = internals.getArgByName(param.__checks, 'min', param.__args);
            property.maximum = internals.getArgByName(param.__checks, 'max', param.__args);
            if (~param.__checks.indexOf('integer')) {
                property.type = 'integer';
            }
        }

        if (property.type === 'object' && param._config) {
            property.type = internals.validatorsToModelName(
                param.options.className || param.options.typeName || property.description,
                param._config,
                models);
        }

        if (property.type === 'array') {
            property.minItems = internals.getArgByName(param.__checks, 'min', param.__args);
            property.maxItems = internals.getArgByName(param.__checks, 'max', param.__args);
            // swagger appears to only support one array type at a time, so lets grab the first one
            var arrayType = internals.getArgByName(param.__checks, 'includes', param.__args);
            if (arrayType) {
                var arrayProperty = internals.validatorToProperty(name, arrayType, models);
                if (arrayProperty.$ref) {
                    property.items = {
                        $ref: arrayProperty.$ref
                    };
                } else {
                    property.items = {
                        type: arrayProperty.type,
                        'enum': arrayProperty['enum']
                    };
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

internals.getResponseMessages = function(notes) {
    var out = {
        notes: [],
        responseMessages: []
    };

    if(internals.isArray(notes)){
        var i = notes.length,
            x = 0,
            hasCodes = false;
        while (x < i) {
            if (internals.trim(notes[x].toLowerCase()).indexOf('error status codes') === 0) {
                hasCodes = true;
            }
            if (hasCodes === true) {
                var items = [],
                    num,
                    note = notes[x];

                if (note.indexOf(',') > -1) {
                    items = note.split(',');
                    if (isNaN(items[0]) === false) {
                        num = parseInt(items[0]);
                        if (num > 99 && num < 600) {
                            out.responseMessages.push({
                                'code': num,
                                'message': internals.trim( items[1] )
                            });
                        }
                    }
                }

            } else {
                out.notes.push(notes[x]);
            }
            x++;
        }
        out.notes = out.notes.join('<br/><br/>');
    }else{
        out.notes = notes;
    }
    return out;
};


internals.trim = function(str) {
    return str.replace(/^\s+|\s+$/g, "");
};

// is an object a array
internals.isArray = function(obj) {
    return obj && !(obj.propertyIsEnumerable('length')) 
        && typeof obj === 'object' 
        && typeof obj.length === 'number';
};

// create a model from an object of Joi validators. Return the model name
internals.validatorsToModelName = function(name, params, models) {

    // if no name create a signature
    if (!name) {
        name = 'Model_' + Object.keys(params).join('_');
    }

    // find existing model by this name
    var model = models[name];
    if (model) {
        return model.id;
    }

    // create new model and save to models collection
    model = {
        "id": name,
        "type": "object",
        "properties": {}
    };
    models[name] = model;

    // decode params for this model
    model.properties = internals.validatorsToProperties(params, models);

    return model.id;
};


// get existance of an item in array of structure [ { name: 'name' } ]
internals.existsByName = function(array, name) {
    return array && array.some(function(v) {
        return v.name === name;
    });
};


// get arg value of an item in arrays of structure
//   [ { name: 'name', arg: 'arg' } ]
// or from two arrays
//   ['name'] [ {'0': 'arg'} ]
internals.getArgByName = function(array, name, args) {
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

internals.arrayOnlyContains = function(array, items) {
    if (!Array.isArray(array) || array.length === 0) {
        return false;
    }
    for (var i = 0, il = array.length; i < il; i++) {
        if (!~items.indexOf(array[i])) {
            return false;
        }
    }
    return true;
};

// unused
internals.getExistsValues = function(exists) {
    var values = [];
    var keys = Object.keys(exists);
    keys.forEach(function(key) {
        key = key.substring(1, key.length - 1);
        if (key !== 'ndefine' && key !== 'ul' && key.length !== 0) {
            values.push(key);
        }
    });
    return values;
};



exports._internals = internals;
