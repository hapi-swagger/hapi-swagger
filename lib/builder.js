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
const Validate = require('../lib/validate');
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
    cors: Joi.boolean(),
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
 * @param  {Object} request
 * @param  {Function} callback
 */
builder.getSwaggerJSON = function (settings, request, callback) {

    // remove items that cannot be changed by user
    delete settings.swagger;
    let connection = request.connection;
    let namedConnection = null;

    if (settings.connectionLabel) {
        connection = namedConnection = request.server.select(settings.connectionLabel).connections[0];
        if (request.server.select(settings.connectionLabel).connections.length === 1) {
            request.server.log(['error'], 'connectionLabel should only define one connection to document');
        }
    }

    // collect root information
    builder.default.host = internals.getHost(request, namedConnection);
    builder.default.schemes = [internals.getSchema(request, connection)];

    settings = Hoek.applyToDefaults(builder.default, settings);
    if (settings.basePath !== '/') {
        settings.basePath = Utilities.removeTrailingSlash(settings.basePath);
    }
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

    let paths = new Paths(settings);
    let pathData = paths.build(routes);
    out.paths = pathData.paths;
    out.definitions = pathData.definitions;
    if (Utilities.hasProperties(pathData['x-alt-definitions'])) {
        out['x-alt-definitions'] = pathData['x-alt-definitions'];
    }
    out = internals.removeNoneSchemaOptions(out);

    if (settings.debug) {
        Validate.log(out, settings.log);
    }

    if (settings.deReference === true) {
        builder.dereference(out, callback);
    } else {
        callback(null, out);
    }
};


/**
 * dereference a schema
 *
 * @param  {Object} schema
 * @param  {Function} callback
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
 * @param  {Object} namedConnection
 * @return {String}
 */
internals.getHost = function (request, namedConnection) {

    let host = request.headers.host;

    // use namedConnection when hapi is set to use hapi-swagger on one connection and the api on another
    if (namedConnection) {
        host = namedConnection.info.host;
        const port = namedConnection.info.port;
        const protocol = namedConnection.info.protocol;
        // do not set port if its protocol http/https with default post numbers
        // this cannot be tested on most desktops as ports below 1024 throw EACCES
         /* $lab:coverage:off$ */
        if (port && (protocol === 'http' && port !== 80) || (protocol === 'https' && port !== 443)) {
            host += ':' + port;
        }
         /* $lab:coverage:on$ */
    }
    return request.headers['x-forwarded-host'] || request.headers['disguised-host'] || host;
};


/**
 * finds the current schema
 *
 * @param  {Object} request
 * @param  {Object} connection
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
 * @param  {Object} options
 * @return {Object}
 */
internals.removeNoneSchemaOptions = function (options) {

    let out = Hoek.clone(options);
    [
        'debug',
        'documentationPath',
        'documentationPage',
        'jsonPath',
        'auth',
        'swaggerUIPath',
        'swaggerUI',
        'pathPrefixSize',
        'payloadType',
        'expanded',
        'lang',
        'sortTags',
        'sortEndpoints',
        'sortPaths',
        'xProperties',
        'reuseDefinitions',
        'uiCompleteScript',
        'deReference',
        'validatorUrl',
        'jsonEditor',
        'acceptToProduce',
        'connectionLabel',
        'cache',
        'pathReplacements',
        'log',
        'cors'
    ].forEach((element) => {

        delete out[element];
    });
    return out;
};
