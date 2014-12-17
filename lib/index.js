


var Hoek = require('hoek'),
    Boom = require('boom'),
    Joi = require('joi'),
    Path = require('path'),
    Crypto = require('crypto');

// Declare internals

var internals = {
    defaults: {
        protocol: null, // If not specified, uses the same protocol as server info
        endpoint: '/docs',
        documentationPath: '/documentation',
        enableDocumentationPage: true,
        auth: false,
        basePath: '',
        pathPrefixSize: 1,
        payloadType: 'json',
        produces: ['application/json'],
        consumes: ['application/json'],
        ui: true,
        listing: true,
        index: false,
        customJSHandler: function(request, reply) {
          reply('').type('application/javascript');
        },
    }
};


internals.first = function first(array) {
    return array ? array[0] : undefined;
};


exports.register = function (plugin, options, next) {

    var settings = Hoek.applyToDefaults(internals.defaults, options || {});


    // add routing for documentation API endpoint ie /docs
    plugin.route({
        method: 'GET',
        path: settings.endpoint,
        config: internals.docs(settings)
    });

    if (settings.enableDocumentationPage) {
        plugin.route({
            method: 'GET',
            path: settings.documentationPath,
            handler: function(request, reply) {
                reply.file(Path.join(__dirname, '..', 'public/swaggerui', 'swagger.html'));
            }
        });
    }

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
            path: settings.endpoint + '/custom.js',
            config: {
                auth:settings.auth,
            },
            handler: settings.customJSHandler,
        });


        // add routing for swaggerui library directory ie /docs/swaggerui
        plugin.route({
            method: 'GET',
            path: settings.endpoint + '/swaggerui/{path*}',
            config: {
                auth: settings.auth
            },
            handler: {
                directory: {
                    path: __dirname + Path.sep + '..' + Path.sep + 'public' + Path.sep + 'swaggerui' + Path.sep,
                    listing: settings.listing,
                    index: settings.index
                }
            }
        });


    }
    next();
};


exports.register.attributes = {
    pkg: require('../package.json')
};


internals.docs = function (settings) {

    return {
        auth: settings.auth,
        validate: {
            query: Joi.object().keys({
                path: Joi.string(),
                tags: Joi.string(),
                api_key: Joi.string()
            })
        },
        handler: function (request, reply) {

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
                routes = routes.filter(function (item) {
                    if (item.method !== 'options' && internals.isResourceRoute(item.path, resourceName)) {
                        return true;
                    }
                    return false;
                });
            }

            // Remove routes without the specified tags allow for + and - tag prefixes
            // e.g.: ?path=vacations&tags=mountains,beach,horses
            //         will show routes WITH 'mountains' OR 'beach' OR 'horses'
            //
            // e.g.: ?path=vacations&tags=mountains,beach,+horses
            //         will show routes WITH ('mountains' OR 'beach')  AND 'horses'
            //
            //  e.g.: ?path=vacations&tags=mountains,+beach,-horses
            //         will show routes WITH 'mountains' AND 'beach' AND NO 'horses'

            if (request.query.tags) {
                tags = request.query.tags.split(',');
                routes = routes.filter(function(route) {
                    var exit;

                    for (var i = 0; i < tags.length; i++) {
                        switch(tags[i].substring(0,1)) {
                            case '-': // exclude tags that match this case
                                var tag = tags[i].substring(1,tags[i].length);
                                if (Hoek.intersect(route.settings.tags, [tag]).length > 0) {
                                    exit = true;
                                }
                                break;
                            case ' ': // (+) filter out tagged paths that do not have this tag!
                                var tag = tags[i].substring(1,tags[i].length);
                                if (Hoek.intersect(route.settings.tags, [tag]).length == 0) {
                                    exit = true;
                                }
                                break;
                        }
                    }

                    // if we have reason to exit, then do so!
                    if (exit == true) {
                        return false;
                    }

                    // default behavior for tags is additive
                    if (Hoek.intersect(route.settings.tags, tags).length > 0) {
                        return true;
                    }

                    // fallback or no tag defined
                    return false;
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
                var apiData = internals.getRoutesData(routes, settings);
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
internals.isResourceRoute = function (routePath, resourceName) {
    if (routePath &&
        resourceName &&
        routePath.search('^/' + resourceName + '(/|$)') === 0) {
        return true;
    }
    return false;
};


// filters route objects into simpler more useful form
internals.getRoutesData = function (routes, settings) {
    var routesData = [];

    routes.forEach(function (route) {
        // only include routes tagged with "api"
        if (!route.settings.tags || route.settings.tags.indexOf('api') < 0) return;

        var routeOptions = route.settings.plugins ? route.settings.plugins['hapi-swagger'] : {};
        var routeData = {
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
            responseMessages: routeOptions && routeOptions.responseMessages || [],
            payloadType: routeOptions && routeOptions.payloadType || null
        };

        if(route.settings.auth && settings.authorizations) {
            route.settings.auth.strategies.forEach(function(strategie) {
                if(settings.authorizations[strategie] && settings.authorizations[strategie].type){
                   routeData.authorizations[settings.authorizations[strategie].type] = settings.authorizations[strategie]
                }
            });
        }

        routesData.push(routeData);
    });

    return {
        routes: routesData
    };
};


// build documentation API discovery endpoint
internals.buildAPIDiscovery = function (settings, routes, tags) {
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
    if (tags) {
        swagger.basePath = settings.endpoint + '?tags=' + tags + '&path='
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

internals._commonPrefix = function (settings, path) {
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

internals._getClassName = function(schema) {
  return schema && schema._settings ?
    schema._settings.className || schema._settings.typeName : undefined;
}

// build documentation API endpoint for each route group
internals.buildAPIInfo = function (settings, apiData, slug) {
    var parts;
    var swagger = {
        "apiVersion": "unknown",
        "swaggerVersion": "1.2",
        "basePath": settings.basePath,
        "resourcePath": '/' + slug,
        "apis": [],
        "models": {}
    };

    if (settings.apiVersion) {
        swagger.apiVersion = settings.apiVersion;
    }

    apiData.routes.forEach(function (route, indexA) {
        var api = {
            "path": route.path,
            "description": route.description,
            "operations": [{
                    "method": route.method,
                    "authorizations": route.authorizations,
                    "summary": route.description,
                    "nickname": route.path.replace(/\//gi, '').replace(/\{/gi, '').replace(/\}/gi, ''),
                    "notes": route.notes,
                    "type": 'void',
                    "parameters": []
            }]
        };

        var op = api.operations[0];

        op.notes = Array.isArray(route.notes) ? route.notes.join('<br/><br/>') : route.notes;
        op.responseMessages = route.responseMessages;

        var pathParam = internals.getParams(route, 'pathParams')
        var queryParam = internals.getParams(route, 'queryParams')
        var headerParam = internals.getParams(route, 'headerParams')

        // build up swagger properties for route validation
        var pathProperties = internals.validatorsToProperties(pathParam, swagger.models);
        var queryProperties = internals.validatorsToProperties(queryParam, swagger.models);
        var headerProperties = internals.validatorsToProperties(headerParam, swagger.models);
        var payloadApiParams;

        // set globally or locally to route
        var payloadType = settings.payloadType
        if(route.payloadType){
            payloadType = route.payloadType;
        }

        if (payloadType.toLowerCase() === 'json') {
            // set as json
            var payloadProperty = internals.validatorToProperty(op.nickname, route.payloadParams, swagger.models);
            if (payloadProperty && payloadProperty.type !== 'void') {
                payloadProperty.required = true;
                op.consumes = settings.consumes || ['application/json'];
            }
            payloadApiParams = internals.propertiesToAPIParams({
                body: payloadProperty
            }, 'body');
        } else {
            // set as form
            var payloadParam = internals.getParams(route, 'payloadParams')
            var payloadProperties = internals.validatorsToProperties(payloadParam, swagger.models);
            payloadApiParams = internals.propertiesToAPIParams(payloadProperties, 'form');
        }


        // add the path, query and body parameters
        op.parameters = op.parameters.concat(
            internals.propertiesToAPIParams(headerProperties, 'header'),
            internals.propertiesToAPIParams(pathProperties, 'path'),
            internals.propertiesToAPIParams(queryProperties, 'query'),
            payloadApiParams
        );

        // set response type and model
        // If the responseSchema is a joi object, response className can be set as an option:
        // Example: route.responseSchema = Joi.object({foo:Joi.string()}).options({className:"MyResponseClass"});

        var responseClassName = internals._getClassName(route.responseSchema);

        var responseProperty = internals.validatorToProperty(responseClassName || op.nickname + '_response',
            internals.getParams(route, 'responseSchema'), swagger.models);
        if (responseProperty) {
            op.type = responseProperty.type || 'void';
            if (op.type !== 'void') {
                op.produces = settings.produces;
            }
            if(responseProperty.items) {
                // add these to the api operations
                op.items = responseProperty.items;
            }
        }

        swagger.apis.push(api);
    });

    return swagger;
};


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
        param.paramType = type;
        if (param.type === "array") {
            param.allowMultiple = true;
        }
        params.push(param);
    }

    return params;
};


// convert an object of Joi validators into an object of swagger schema properties
internals.validatorsToProperties = function (params, models, requiredArray) {
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
            properties[key] = internals.validatorToProperty(key, param, models, requiredArray);
            x++;
        }
    }

    return properties;
};

// decode a Joi validator into swagger schema property
internals.validatorToProperty = function (name, param, models, requiredArray) {
    if (param === null ||
        param === undefined) {
        return undefined;
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
        var describe = param.describe();
        property.type = param._type.toLowerCase();
        property.description = typeof param._description === 'string' ? param._description : undefined;
        property.notes = typeof param._notes !== 'function' && param._notes.length ? param._notes : undefined;
        property.tags = typeof param._tags !== 'function' && param._tags.length ? param._tags : undefined;
        property.defaultValue = (describe.flags) ? describe.flags.default : null;

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
            property.type = internals.validatorsToModelName(
                    className || name || property.description,
                param,
                models);
        }

        if (property.type === 'array') {
            property.minItems = internals.getArgByName(describe.rules, 'min');
            property.maxItems = internals.getArgByName(describe.rules, 'max');

            var arrayTypes = param._inner ? param._inner.inclusions : internals.getArgByName(describe.rules, 'includes');
            // swagger appears to only support one array type at a time, so lets grab the first one
            var firstInclusionType = internals.first(arrayTypes);

            if (firstInclusionType) {
                // get className of embeded array
                if(name === 'items' && Hoek.reach(param, '_inner.inclusions.0._settings.className')){
                    name = Hoek.reach(param, '_inner.inclusions.0._settings.className');
                }

                var arrayProperty = internals.validatorToProperty(name, firstInclusionType, models);

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


// create a model from an object of Joi validators. Return the model name
internals.validatorsToModelName = function (name, params, models) {

    // if no name create a signature
    if (!name) {
        name = 'Model_' + Crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
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
internals.existsByName = function (array, name) {
    return array && array.some(function (v) {
        return v.name === name;
    });
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



exports._internals = internals;
