'use strict';
const Hoek = require('hoek');
const Joi = require('joi');
const JSONDeRef = require('json-schema-ref-parser');
const Filter = require('../lib/filter');
const Group = require('../lib/group');
const Sort = require('../lib/sort');
const Info = require('../lib/info');
const Paths = require('../lib/paths');
const Tags = require('../lib/tags');
const Utilities = require('../lib/utilities');

const builder = module.exports = {};
const internals = {};



/**
 * default data for swagger root object
 */
builder.default = {
    'swagger': '2.0',
    'host': 'localhost',
    'basePath': '/'
};


/**
 * schema for swagger root object
 */
builder.schema = Joi.object({
    swagger: Joi.string().valid('2.0').required(),
    info: Joi.any(),
    host: Joi.string(),  // JOI hostname validator too strict
    basePath: Joi.string().regex(/^\//),
    schemes: Joi.array().items(Joi.string().valid(['http', 'https', 'ws', 'wss'])).optional(),
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
    }),
    cache: Joi.object({
        expiresIn: Joi.number(),
        expiresAt: Joi.string(),
        generateTimeout: Joi.number()
    })
});


/**
 * gets the Swagger JSON
 *
 * @param  {Object} settings
 * @return {Object}
 */
builder.getSwaggerJSON = function (settings, request, callback) {

    // remove items that cannot be changed by user
    delete settings.swagger;
    let connection = request.connection;
    let useRequestHost = true;

    if (settings.connectionLabel) {
        connection = request.server.select(settings.connectionLabel).connections[0];
        useRequestHost = false;
        if (request.server.select(settings.connectionLabel).connections.length !== 1) {
            request.server.log(['error'], 'connectionLabel should only define one connection to document');
        }
    }

    // collect root information
    builder.default.host = internals.getHost(request, connection, useRequestHost);
    builder.default.schemes = [internals.getSchema(request, connection)];

    settings = Hoek.applyToDefaults(builder.default, settings);
    let out = internals.removeNoneSchemaOptions(settings);
    Joi.assert(out, builder.schema);

    out.info = Info.build(settings);
    out.tags = Tags.build(settings);

    let routes = connection.table();

    routes = Filter.byTags(['api'], routes);
    Sort.paths(settings.sortPaths, routes);

    // filter routes displayed based on tags passed in query string
    if (request.query.tags) {
        let filterTags = request.query.tags.split(',');
        routes = Filter.byTags(filterTags, routes);
    }

    // append group property - by path
    Group.appendGroupByPath(settings.pathPrefixSize, settings.basePath, routes, settings.pathReplacements);

    let pathData = Paths.build(settings, routes);
    out.paths = pathData.paths;
    out.definitions = pathData.definitions;
    if (Utilities.hasProperties(pathData['x-alt-definitions'])){
        out['x-alt-definitions'] = pathData['x-alt-definitions'];
    }
    out = internals.removeNoneSchemaOptions(out);

    if (settings.derefJSONSchema === true) {
        builder.dereference(out, callback);
    } else {
        callback(null, out);
    }
};


/**
 * dereference a schema
 *
 * @param  {Object} schema
 * @param  {Object} callback
 */
builder.dereference = function (schema, callback) {

    JSONDeRef.dereference(schema, function (err, json) {

        if (!err) {
            delete json.definitions;
            delete json['x-alt-definitions'];
        } else {
            err = { 'error': 'fail to dereference schema' };
        }
        callback(err, json);
    });
};


/**
 * finds the current host
 *
 * @param  {Object} request
 * @param  {Object} connection
 * @param  {Object} useRequestHost
 * @return {String}
 */
internals.getHost = function (request, connection, useRequestHost) {

    let host = connection.info.host;
    /* $lab:coverage:off$ */
    if (connection.info.port) {
        host += ':' + connection.info.port;
    }
    /* $lab:coverage:on$ */
    if (useRequestHost === true){
        host = request.headers.host;
    }
    return request.headers['x-forwarded-host'] || request.headers['disguised-host'] || host;
};


/**
 * finds the current schema
 *
 * @param  {Object} request
 * @return {String}
 */
internals.getSchema = function (request, connection) {

    const forwardedProtocol = request.headers['x-forwarded-proto'];

    if (forwardedProtocol) {
        return forwardedProtocol;
    }

    // Azure Web Sites adds this header when requests was received via HTTPS.
    if (request.headers['x-arr-ssl']) {
        return 'https';
    }

    const protocol = connection.info.protocol;

    // When iisnode is used, connection protocol is `socket`. While IIS
    // receives request over HTTP and passes it to node via a named pipe.
    if (protocol === 'socket') {
        return 'http';
    }

    return protocol;
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
        'debug',
        'documentationPath',
        'enableDocumentation',
        'jsonPath',
        'swaggerUIPath',
        'enableSwaggerUI',
        'auth',
        'pathPrefixSize',
        'payloadType',
        'expanded',
        'lang',
        'sortTags',
        'sortEndpoints',
        'sortPaths',
        'addXProperties',
        'derefJSONSchema',
        'validatorUrl',
        'jsonEditor',
        'acceptToProduce',
        'connectionLabel',
        'cache',
        'suppressVersionFromBasePath',
        'pathReplacements'
    ].forEach( (element) => {

        delete out[element];
    });
    return out;
};
