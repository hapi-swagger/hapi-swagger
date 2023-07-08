const Hoek = require('@hapi/hoek');
const Joi = require('joi');
const JSONDeRef = require('@apidevtools/json-schema-ref-parser');
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
 * @typedef {import('@hapi/hapi').Request}
 */

/**
 * default data for swagger root object
 */
builder.default = {
  basePath: '/',
  routeTag: 'api'
};

internals.openapiBaseSchema = Joi.object({
  info: Joi.any(),
  schemes: Joi.array().items(Joi.string().valid('http', 'https', 'ws', 'wss')).optional(),
  consumes: Joi.array().items(Joi.string()),
  produces: Joi.array().items(Joi.string()),
  paths: Joi.any(),
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
})
  .or('swagger', 'openapi')
  .pattern(/^x-/, Joi.any());

/**
 * schema for swagger root object
 */
builder.schema = {
  swagger: internals.openapiBaseSchema.keys({
    swagger: Joi.string().valid('2.0').required(),
    host: Joi.string(), // JOI hostname validator too strict
    basePath: Joi.string().regex(/^\//),
    definitions: Joi.any(),
    parameters: Joi.any(),
    responses: Joi.any(),
    securityDefinitions: Joi.any()
  }),
  openapi3: internals.openapiBaseSchema.keys({
    openapi: Joi.string().valid('3.0.0').required(),
    servers: Joi.array().items(
      Joi.object({
        url: Joi.string().uri(),
        description: Joi.string()
      })
    ),
    components: Joi.object({
      schemas: Joi.any(),
      parameters: Joi.any(),
      responses: Joi.any(),
      securitySchemes: Joi.any()
    })
  })
};

/**
 * gets the Swagger JSON
 *
 * @param  {Object} settings
 * @param  {Request} request
 */
builder.getSwaggerJSON = async (settings, request) => {
  // remove items that cannot be changed by user
  delete settings.swagger;
  delete settings.templates;

  // collect root information

  settings = Hoek.applyToDefaults(builder.default, settings);
  if (settings.basePath !== '/') {
    settings.basePath = Utilities.removeTrailingSlash(settings.basePath);
  }

  if (settings.OAS === 'v2') {
    settings.swagger = '2.0';
    settings.host = settings.host || internals.getHost(request);
    settings.schemes = settings.schemes || [internals.getSchema(request)];
  } else {
    settings.openapi = '3.0.0';
    settings.servers = settings.servers || [{ url: internals.getServerUrl(request, settings) }];
    settings.components = {};
    if (settings.securityDefinitions) {
      settings.components.securitySchemes = settings.securityDefinitions;
    }
  }

  let out = internals.removeNoneSchemaOptions(settings, settings);
  Joi.assert(out, settings.OAS === 'v2' ? builder.schema.swagger : builder.schema.openapi3);

  if (settings.customSwaggerFile) {
    Object.assign(settings.customSwaggerFile, out);

    return settings.customSwaggerFile;
  }

  out.info = Info.build(settings);
  out.tags = Tags.build(settings);

  let routes = request.server.table();

  // filter routes displayed based on tags passed in query string
  if (request.query.tags) {
    const queryTags = request.query.tags.split(',');
    routes = Filter.byTags(queryTags, routes);
  }

  if (typeof settings.routeTag === 'function') {
    routes = Filter.byFunction(settings.routeTag, routes);
  } else {
    routes = Filter.byTags([settings.routeTag], routes);
  }

  Sort.paths(settings.sortPaths, routes);

  // append group property - by path
  Group.appendGroupByPath(settings.pathPrefixSize, settings.basePath, routes, settings.pathReplacements);

  const paths = new Paths(settings);
  const pathData = paths.build(routes);
  out.paths = pathData.paths;

  if (settings.OAS === 'v2') {
    out.definitions = pathData.definitions;
  } else {
    out.components.schemas = pathData.definitions;
  }

  if (Utilities.hasProperties(pathData['x-alt-definitions'])) {
    out['x-alt-definitions'] = pathData['x-alt-definitions'];
  }

  out = internals.removeNoneSchemaOptions(out, settings);

  if (settings.OAS === 'v3.0') {
    delete out.produces;
    delete out.consumes;
  }

  if (settings.debug) {
    await Validate.log(out, settings.log);
  }

  if (settings.deReference === true) {
    return builder.dereference(out);
  }

  return out;
};

/**
 * dereference a schema
 *
 * @param  {Object} schema
 */
builder.dereference = async (schema) => {
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
 * @param {string} name header name (without x-forwarded prefix)
 * @return {string | undefined}
 */
internals.getProxyHeader = function (request, name) {
  const header = request.headers['x-forwarded-' + name];

  return header ? header.split(',')[0] : undefined;
};

/**
 * finds the current host
 *
 * @param  {Request} request
 * @return {string}
 */
internals.getHost = function (request) {
  const proxyHost = internals.getProxyHeader(request, 'host') || request.headers['disguised-host'] || '';
  if (proxyHost) {
    return proxyHost;
  }

  try {
    const url = new URL(request.info.referrer);
    return url.host;
  } catch (error) {
    // backup in case referrer isn't set for some reason. (i.e. tests)
    return request.info.host;
  }
};

internals.getServerUrl = function (request, settings) {
  const forwardedProtocol = internals.getProxyHeader(request, 'proto');
  const proxyHost = internals.getProxyHeader(request, 'host') || request.headers['disguised-host'] || '';
  if (proxyHost) {
    return `${forwardedProtocol ?? internals.getSchema(request)}://${proxyHost}${settings.basePath}`;
  }

  try {
    const url = new URL(request.info.referrer);
    url.search = '';
    url.hash = '';
    url.pathname = settings.basePath;
    return url.toString();
  } catch (error) {
    // backup in case referrer isn't set for some reason. (i.e. tests)
    return `${request.url.protocol}//${request.info.host}${settings.basePath === '/' ? '' : settings.basePath}`;
  }
};

/**
 * finds the current schema
 *
 * @param  {Request} request
 * @return {string}
 */
internals.getSchema = function (request) {
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
internals.removeNoneSchemaOptions = function (options, settings) {
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
    'uiOptions',
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
    'customSwaggerFile',
    'wildcardMethods',
    'OAS',
    ...(settings.OAS === 'v2' ? [] : ['basePath', 'securityDefinitions'])
  ].forEach((element) => {
    delete out[element];
  });
  return out;
};
