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
            nickname: Hoek.reach(routeOptions, 'nickname') || null,
            payloadType: Hoek.reach(routeOptions, 'payloadType') || null,
            security: Hoek.reach(routeOptions, 'security') || null,
            groups: route.group
        };


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
        'definitions': {
        }
    };

    routes.forEach((route) => {

        let method = route.method;
        let out = {
            'summary': route.description,
            'operationId': route.nickname || route.path.replace(/\//gi, '').replace(/\{/gi, '').replace(/\}/gi, ''),
            'description': route.notes,
            'parameters': []
        };
        let path = route.path;

        // tags in swagger are used for grouping
        out.tags = route.groups;
        out.description = Array.isArray(route.notes) ? route.notes.join('<br/><br/>') : route.notes;

        if (route.security) {
            out.security = route.security;
        }

        // set from plugin options or from route options
        let payloadType = internals.overload(settings.payloadType, route.payloadType);
        let consumes = internals.overload(settings.consumes, route.consumes);
        let produces = internals.overload(settings.consumes, route.produces);

        if (route.consumes) {
            out.consumes = route.consumes;
        }
        if (route.produces) {
            out.produces = route.produces;
        }
        // use mimetype to override payloadType
        if (Array.isArray(consumes)
            && (consumes.indexOf('application/x-www-form-urlencoded') > -1
                || consumes.indexOf('multipart/form-data') > -1)) {
            payloadType = 'form';
        }


        // build payload either with JSON or form input
        let payloadParameters;
        if (payloadType.toLowerCase() === 'json') {

            // set as json
            payloadParameters = Properties.parseProperty(null, route.payloadParams, swagger.definitions);
            //var definitionName = Utilities.getJoiMetaProperty(route.payloadParams, 'name');
            let definitionName = Hoek.reach(route.payloadParams, '_settings.language.label');

            // override inline structure and use defination object
            if (payloadParameters && payloadParameters.type !== 'void') {
                payloadParameters.in = 'body';
                payloadParameters.name = 'body';
                payloadParameters.schema = {
                    '$ref': '#/definitions/' + Definitions.appendJoi(
                        definitionName,
                        internals.getJOIObj(route, 'payloadParams'),
                        swagger.definitions,
                        'parameters_' + out.operationId + '_' + method.toLowerCase()
                        )
                };
                delete payloadParameters.properties;
                delete payloadParameters.type;
            }

        } else {
            payloadParameters = Properties.toParameters(internals.getJOIObj(route, 'payloadParams'), swagger.definitions, 'formData');
            // add form mimetype
            out.consumes = (out.consumes) ? out.consumes : [];
            if (out.consumes.indexOf('application/x-www-form-urlencoded') === -1) {
                out.consumes = ['application/x-www-form-urlencoded'];
            }
        }

        out.parameters = out.parameters.concat(
            Properties.toParameters(internals.getJOIObj(route, 'headerParams'), swagger.definitions, 'header'),
            Properties.toParameters(internals.getJOIObj(route, 'pathParams'), swagger.definitions, 'path'),
            Properties.toParameters(internals.getJOIObj(route, 'queryParams'), swagger.definitions, 'query')
            );
        if (payloadParameters) {
            out.parameters = out.parameters.concat(payloadParameters);
        }

        // change form mimetype based on meta property 'swaggerType'
        if (internals.hasFileType(route)) {
            out.consumes = (out.consumes) ? out.consumes : [];
            // add to front of array so swagger-ui picks it up
            if (out.consumes.indexOf('multipart/form-data') === -1) {
                out.consumes = ['multipart/form-data'];
            }
        }

        //let name = out.operationId + method;
        out.responses = Responses.build(
            route.responses,
            route.responseSchema,
            route.responseStatus,
            swagger.definitions,
            out.operationId + '_' + method.toLowerCase()
            );

        if (!pathObj[path]) {
            pathObj[path] = {};
        }
        pathObj[path][method.toLowerCase()] = out;
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
