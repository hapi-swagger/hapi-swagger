'use strict';
const Hoek = require('hoek');
const Joi = require('joi');
const Definitions = require('../lib/definitions');
const Properties = require('../lib/properties');
const Responses = require('../lib/responses');
const Utilities = require('../lib/utilities');

const internals = {};
const paths = module.exports = {};


// default data for path
paths.defaults = {
    responses: {}
};


// schema for paths
paths.schema = Joi.object({
    tags: Joi.array().items(Joi.string()),
    summary: Joi.string(),
    description: Joi.string(),
    externalDocs: Joi.object({
        description: Joi.string(),
        url: Joi.string().uri()
    }),
    operationId: Joi.string(),
    consumes: Joi.array().items(Joi.string()),
    produces: Joi.array().items(Joi.string()),
    parameters: Joi.array().items(Joi.object()),
    responses: Joi.object().required(),
    schemes: Joi.array().items(Joi.string().valid(['http', 'https', 'ws', 'wss'])),
    deprecated: Joi.boolean(),
    security: Joi.array().items(Joi.object())
});


/**
 * build the swagger path section
 *
 * @param  {Object} setting
 * @param  {Object} routes
 * @return {Object}
 */
paths.build = function (settings, routes) {

    Responses.build({}, {}, {}, {});

    let routesData = [];

    // loop each route
    routes.forEach((route) => {

        let routeOptions = Hoek.reach(route, 'settings.plugins.hapi-swagger') || {};
        let routeData = {
            path: route.path,
            method: route.method.toUpperCase(),
            description: route.settings.description,
            notes: route.settings.notes,
            tags: Hoek.reach(route, 'settings.tags'),
            queryParams: Hoek.reach(route, 'settings.validate.query'),
            pathParams: Hoek.reach(route, 'settings.validate.params'),
            payloadParams: Hoek.reach(route, 'settings.validate.payload'),
            responseSchema: Hoek.reach(route, 'settings.response.schema'),
            responseStatus: Hoek.reach(route, 'settings.response.status'),
            headerParams: Hoek.reach(route, 'settings.validate.headers'),
            consumes: Hoek.reach(routeOptions, 'consumes') || null,
            produces: Hoek.reach(routeOptions, 'produces') || null,
            responses: Hoek.reach(routeOptions, 'responses') || null,
            payloadType: Hoek.reach(routeOptions, 'payloadType') || null,
            security: Hoek.reach(routeOptions, 'security') || null,
            order: Hoek.reach(routeOptions, 'order') || null,
            deprecated: Hoek.reach(routeOptions, 'deprecated') || null,
            id: Hoek.reach(routeOptions, 'id') || null,
            groups: route.group
        };


        routeData.path = Utilities.replaceInPath(routeData.path, ['endpoints'], settings.pathReplacements);


        // deprecate 'nickname' at next major release
        if (Hoek.reach(routeOptions, 'nickname')) {
            routeData.id = Hoek.reach(routeOptions, 'nickname');
        }


        // user configured interface through route plugin options
        if (Hoek.reach(routeOptions, 'validate.query')) {
            routeData.queryParams = Properties.joiObjectToArray(Hoek.reach(routeOptions, 'validate.query'));
        }
        if (Hoek.reach(routeOptions, 'validate.params')) {
            routeData.pathParams = Properties.joiObjectToArray(Hoek.reach(routeOptions, 'validate.params'));
        }
        if (Hoek.reach(routeOptions, 'validate.headers')) {
            routeData.headerParams = Properties.joiObjectToArray(Hoek.reach(routeOptions, 'validate.headers'));
        }
        if (Hoek.reach(routeOptions, 'validate.payload')) {
            // has different structure, just pass straight through
            routeData.payloadParams = Hoek.reach(routeOptions, 'validate.payload');
            // if its a native javascript object convert it to JOI
            if (!routeData.payloadParams.isJoi) {
                routeData.payloadParams = Joi.object(routeData.payloadParams);
            }
        }


        // swap out any custom validation function for Joi object
        [
            'queryParams',
            'pathParams',
            'headerParams',
            'payloadParams'
        ].forEach(function (property) {

            if (Utilities.isFunction(routeData[property])) {
                routeData[property] = Joi.object().label('Hidden Model');
            }
        });



        // hapi wildcard method support
        if (routeData.method === '*') {
            // OPTIONS not supported by Swagger and HEAD not support by HAPI
            ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach((method) => {

                var newRoute = Hoek.clone(routeData);
                newRoute.method = method.toUpperCase();
                routesData.push(newRoute);
            });
        } else {
            routesData.push(routeData);
        }
    });


    return paths.properties(settings, routesData);
};


/**
 * build the swagger path section
 *
 * @param  {Object} setting
 * @param  {Object} routes
 * @return {Object}
 */
paths.properties = function (settings, routes) {

    let pathObj = {};
    let swagger = {
        'definitions': {},
        'x-alt-definitions': {}
    };

    routes.forEach((route) => {

        let method = route.method;
        let out = {
            'summary': route.description,
            'operationId': route.id || Utilities.createId(route.method, route.path),
            'description': route.notes,
            'parameters': [],
            'consumes': [],
            'produces': []
        };
        let path = internals.removeBasePath( route.path, settings.basePath, settings.pathReplacements );

        // tags in swagger are used for grouping
        out.tags = route.groups;

        out.description = Array.isArray(route.notes) ? route.notes.join('<br/><br/>') : route.notes;

        if (route.security) {
            out.security = route.security;
        }

        // set from plugin options or from route options
        let payloadType = internals.overload(settings.payloadType, route.payloadType);

        // build payload either with JSON or form input
        let payloadParameters;
        if (payloadType.toLowerCase() === 'json') {

            // set as json
            payloadParameters = Properties.parseProperty(null, route.payloadParams, swagger.definitions, swagger['x-alt-definitions']);

            let definitionName = Utilities.geJoiLabel( route.payloadParams );

            // override inline structure and use defination object
            if (payloadParameters && payloadParameters.type !== 'void') {
                payloadParameters.in = 'body';
                payloadParameters.name = 'body';
                payloadParameters.schema = {
                    '$ref': '#/definitions/' + Definitions.appendJoi(
                        definitionName,
                        internals.getJOIObj(route, 'payloadParams'),
                        swagger.definitions,
                        swagger['x-alt-definitions'],
                        'parameters_' + out.operationId,
                        false
                        )
                };
                delete payloadParameters.properties;
                delete payloadParameters.type;
            }


        } else {
            payloadParameters = Properties.toParameters(internals.getJOIObj(route, 'payloadParams'), swagger.definitions, swagger['x-alt-definitions'], 'formData', false);
            // add form mimetype
            out.consumes = ['application/x-www-form-urlencoded'];
        }


        // change form mimetype based on meta property 'swaggerType'
        if (internals.hasFileType(route)) {
            out.consumes = ['multipart/form-data'];
        }

        // add user defined over automaticlly discovered
        if (settings.consumes || route.consumes) {
            out.consumes = internals.overload(settings.consumes, route.consumes);
        }

        if (settings.produces || route.produces) {
            out.produces = internals.overload(settings.produces, route.produces);
        }


        // set required true/false for each path params
        var pathParams = Properties.toParameters(internals.getJOIObj(route, 'pathParams'), swagger.definitions, swagger['x-alt-definitions'], 'path', false);
        pathParams.forEach(function (item) {

            // default is optional
            if (item.required === undefined) {
                if (path.indexOf('{' + item.name + '}') > -1) {
                    item.required = true;
                }
                if (path.indexOf('{' + item.name + '?}') > -1) {
                    item.required = false;
                }
            }
            if (item.required === undefined) {
                item.required = false;
            }
        });

        // removes ? from {prama?} after we have set required/optional for path params
        path = internals.cleanPathParameters( path );

        let headerParams = Properties.toParameters(internals.getJOIObj(route, 'headerParams'), swagger.definitions, swagger['x-alt-definitions'], 'header', false);
        // if the API has a user set accept header with a enum convert into the produces array
        if (settings.acceptToProduce === true) {
            headerParams = headerParams.filter(function (header) {

                if (header.name.toLowerCase() === 'accept') {
                    if (header.enum) {
                        out.produces = Utilities.sortFirstItem(header.enum, header.default);
                        return false;
                    }
                }
                return true;
            });
        }

        out.parameters = out.parameters.concat(
            headerParams,
            pathParams,
            Properties.toParameters(internals.getJOIObj(route, 'queryParams'), swagger.definitions, swagger['x-alt-definitions'], 'query', false)
            );
        if (payloadParameters) {
            out.parameters = out.parameters.concat(payloadParameters);
        }

        // if the api sets the content-type header pramater use that
        if (internals.hasContentTypeHeader(out)) {
            delete out.consumes;
        }

        //let name = out.operationId + method;
        out.responses = Responses.build(
            route.responses,
            route.responseSchema,
            route.responseStatus,
            swagger.definitions,
            swagger['x-alt-definitions'],
            out.operationId
            );

        if (route.order) {
            out['x-order'] = route.order;
        }
        if (route.deprecated !== null) {
            out.deprecated = route.deprecated;
        }

        if (!pathObj[path]) {
            pathObj[path] = {};
        }
        pathObj[path][method.toLowerCase()] = Utilities.deleteEmptyProperties(out);
    });

    swagger.paths = pathObj;
    return swagger;
};


/**
 * gets the JOI object from route object
 *
 * @param  {Object} base
 * @param  {String} name
 * @return {Object}
 */
internals.getJOIObj = function (route, name) {

    let prama = route[name];
    if (Utilities.hasJoiChildren(route[name])) {
        prama = route[name]._inner.children;
    }
    return prama;
};


/**
 * overload one object with another
 *
 * @param  {Object} base
 * @param  {Object} priority
 * @return {Object}
 */
internals.overload = function (base, priority) {

    return (priority) ? priority : base;
};


/**
 * does route have property swaggerType of file
 *
 * @param  {Object} route
 * @return {Boolean}
 */
internals.hasFileType = function (route) {

    let routeString = JSON.stringify(route);
    return routeString.indexOf('swaggerType') > -1;
};


/**
 * clear path parameters of optional char flag
 *
 * @param  {String} path
 * @return {String}
 */
internals.cleanPathParameters = function (path) {

    return path.replace('?}','}');
};


/**
 * remove the base path from endpoint
 *
 * @param  {String} path
 * @param  {String} basePath
 * @param  {Array} pathReplacements
 * @return {String}
 */
internals.removeBasePath = function (path, basePath, pathReplacements) {

    if (basePath !== '/' && Utilities.startsWith(path, basePath)) {
        path = path.replace(basePath, '');
        path = Utilities.replaceInPath(path, ['endpoints'], pathReplacements);
    }
    return path;
};


/**
 * does path parameters have a content-type header
 *
 * @param  {String} path
 * @return {boolean}
 */
internals.hasContentTypeHeader = function (path) {

    let out = false;
    path.parameters.forEach(function (prama) {

        if (prama.in === 'header' && prama.name.toLowerCase() === 'content-type') {
            out = true;
        }
    });
    return out;
};
