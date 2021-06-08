const Hoek = require('@hapi/hoek');
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

const builder = (module.exports = {});
const internals = {};

/**
 * default data for swagger root object
 */
builder.default = {
  swagger: '2.0',
  host: 'localhost',
  basePath: '/',
  routeTag: 'api'
};

/**
 * schema for swagger root object
 */
builder.schema = Joi.object({
  swagger: Joi.string()
    .valid('2.0')
    .required(),
  info: Joi.any(),
  host: Joi.string(), // JOI hostname validator too strict
  basePath: Joi.string().regex(/^\//),
  schemes: Joi.array()
    .items(Joi.string().valid('http', 'https', 'ws', 'wss'))
    .optional(),
  consumes: Joi.array().items(Joi.string()),
  produces: Joi.array().items(Joi.string()),
  paths: Joi.any(),
  definitions: Joi.any(),
  parameters: Joi.any(),
  responses: Joi.any(),
  securityDefinitions: Joi.any(),
  security: Joi.any(),
  grouping: Joi.string().valid('path', 'tags'),
  tagsGroupingFilter: Joi.func(),
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
}).pattern(/^x-/, Joi.any());

/**
 * gets the Swagger JSON
 *
 * @param  {Object} settings
 * @param  {Object} request
 * @param  {Function} callback
 */
builder.getSwaggerJSON = async (settings, request) => {
  // remove items that cannot be changed by user
  delete settings.swagger;
  delete settings.templates;

  // collect root information
  builder.default.host = internals.getHost(request);
  builder.default.schemes = [internals.getSchema(request)];

  settings = Hoek.applyToDefaults(builder.default, settings);
  if (settings.basePath !== '/') {
    settings.basePath = Utilities.removeTrailingSlash(settings.basePath);
  }
  let out = internals.removeNoneSchemaOptions(settings);
  Joi.assert(out, builder.schema);

  out.info = Info.build(settings);
  out.tags = Tags.build(settings);

  let routes = request.server.table();

  routes = Filter.byTags([settings.routeTag], routes);
  Sort.paths(settings.sortPaths, routes);

  // filter routes displayed based on tags passed in query string
  if (request.query.tags) {
    const filterTags = request.query.tags.split(',');
    routes = Filter.byTags(filterTags, routes);
  }

  // append group property - by path
  Group.appendGroupByPath(settings.pathPrefixSize, settings.basePath, routes, settings.pathReplacements);

  const paths = new Paths(settings);
  const pathData = paths.build(routes);
  out.paths = pathData.paths;
  out.definitions = pathData.definitions;
  if (Utilities.hasProperties(pathData['x-alt-definitions'])) {
    out['x-alt-definitions'] = pathData['x-alt-definitions'];
  }
  out = internals.removeNoneSchemaOptions(out);

  if (settings.debug) {
    await Validate.log(out, settings.log);
  }

  if (settings.deReference === true) {
    return builder.dereference(out);
  } else {
    return out;
  }
};

/**
 * dereference a schema
 *
 * @param  {Object} schema
 * @param  {Function} callback
 */
builder.dereference = async schema => {
  try {
    const json = await JSONDeRef.dereference(schema);
    delete json.definitions;
    delete json['x-alt-definitions'];
    return json;
  } catch (err) {
    throw new Error('failed to dereference schema');
  }
};

/**
 * return originating value for an `x-forwarded` header
 * @param {Object} request
 * @param {String} name header name (without x-forwarded prefix)
 * @return {String}
 */
internals.getProxyHeader = function(request, name) {
  const header = request.headers['x-forwarded-' + name];

  return header ? header.split(',')[0] : undefined;
};

/**
 * finds the current host
 *
 * @param  {Object} request
 * @return {String}
 */
internals.getHost = function(request) {
  const proxyHost = internals.getProxyHeader(request, 'host') || request.headers['disguised-host'] || '';
  if (proxyHost) {
    return proxyHost;
  }

  const reqHost = request.info.host.split(':');
  const host = reqHost[0];
  const port = parseInt(reqHost[1] || '', 10);
  const protocol = request.server.info.protocol;

  // do not set port if its protocol http/https with default post numbers
  // this cannot be tested on most desktops as ports below 1024 throw EACCES
  /* $lab:coverage:off$ */
  if (!isNaN(port) && ((protocol === 'http' && port !== 80) || (protocol === 'https' && port !== 443))) {
    return host + ':' + port;
  }
  /* $lab:coverage:on$ */

  return host;
};

/**
 * finds the current schema
 *
 * @param  {Object} request
 * @param  {Object} connection
 * @return {String}
 */
internals.getSchema = function(request) {
  const forwardedProtocol = internals.getProxyHeader(request, 'proto');

  if (forwardedProtocol) {
    return forwardedProtocol;
  }

  // Azure Web Sites adds this header when requests was received via HTTPS.
  if (request.headers['x-arr-ssl']) {
    return 'https';
  }

  const protocol = request.server.info.protocol;

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
internals.removeNoneSchemaOptions = function(options) {
  const out = Hoek.clone(options);
  [
    'debug',
    'documentationPath',
    'documentationRoutePlugins',
    'documentationRouteTags',
    'documentationPage',
    'jsonPath',
    'jsonRoutePath',
    'auth',
    'swaggerUIPath',
    'routesBasePath',
    'swaggerUI',
    'pathPrefixSize',
    'payloadType',
    'expanded',
    'sortTags',
    'sortEndpoints',
    'sortPaths',
    'grouping',
    'tagsGroupingFilter',
    'xProperties',
    'reuseDefinitions',
    'uiCompleteScript',
    'deReference',
    'definitionPrefix',
    'validatorUrl',
    'acceptToProduce',
    'cache',
    'pathReplacements',
    'log',
    'cors',
    'routeTag',
    'validate',
    'tryItOutEnabled',
  ].forEach(element => {
    delete out[element];
  });
  return out;
};
