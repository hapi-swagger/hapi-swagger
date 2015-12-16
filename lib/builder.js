'use strict';
const Hoek = require('hoek');
const Joi = require('joi');
const Filter = require('../lib/filter');
const Group = require('../lib/group');
const Info = require('../lib/info');
const Paths = require('../lib/paths');
const Tags = require('../lib/tags');

const builder = module.exports = {};
const internals = {};



/**
 * default data for swagger root object
 */
builder.default = {
    'swagger': '2.0',
    'schemes': ['http'],
    'host': 'localhost',
    'basePath': '/',
    'consumes': ['application/json'],
    'produces': ['application/json']
};


/**
 * schema for swagger root object
 */
builder.schema = Joi.object({
    swagger: Joi.string().valid('2.0').required(),
    info: Joi.any(),
    host: Joi.string(),  // JOI hostname validator too strict
    basePath: Joi.string().regex(/^\//),
    schemes: Joi.array().items(Joi.string().valid(['http', 'https', 'ws', 'wss'])),
    consumes: Joi.array().items(Joi.string()),
    produces: Joi.array().items(Joi.string()),
    paths: Joi.any(),
    definitions: Joi.any(),
    parameters: Joi.any(),
    responses: Joi.any(),
    securityDefinitions: Joi.any(),
    security: Joi.any(),
    tags: Joi.any(),
    externalDocs: Joi.object({
        description: Joi.string(),
        url: Joi.string().uri()
    })
});


/**
 * gets the Swagger JSON
 *
 * @param  {Object} settings
 * @return {Object}
 */
builder.getSwaggerJSON = function (settings, request) {

    // remove items that cannot be changed by user
    delete settings.swagger;

    // collect root information
    builder.default.host = internals.getHost(request);
    builder.default.schemes = [internals.getSchema(request)];

    settings = Hoek.applyToDefaults(builder.default, settings);
    let out = internals.removeNoneSchemaOptions(settings);
    Joi.assert(out, builder.schema);

    out.info = Info.build(settings);
    out.tags = Tags.build(settings);

    let routes = request.connection.table();

    // filter routes displayed based on tags passed in query string
    if (request.query.tags) {
        let filterTags = request.query.tags.split(',');
        routes = Filter.byTags(filterTags, routes);
    }

    // group the routes - by path
    Group.byPath(settings, routes);

    let pathData = Paths.build(settings, routes);
    out.paths = pathData.paths;
    out.definitions = pathData.definitions;

    return internals.removeNoneSchemaOptions(out);
};


/**
 * finds the current host
 *
 * @param  {Object} request
 * @return {String}
 */
internals.getHost = function (request) {

    return request.headers['x-forwarded-host'] || request.headers.host;
};


/**
 * finds the current schema
 *
 * @param  {Object} request
 * @return {String}
 */
internals.getSchema = function (request) {

    return request.headers['x-forwarded-proto'] || request.connection.info.protocol;
};


/**
 * removes none schema properties from options
 *
 * @param  {Object} request
 * @return {String}
 */
internals.removeNoneSchemaOptions = function (options) {

    let out = Hoek.clone(options);
    [
        'documentationPath',
        'jsonPath',
        'swaggerUIPath',
        'auth',
        'pathPrefixSize',
        'payloadType',
        'enableDocumentation',
        'expanded',
        'lang',
        'addXProperties'
    ].forEach( (element) => {

        delete out[element];
    });
    return out;
};
