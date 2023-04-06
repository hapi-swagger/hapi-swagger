const Hoek = require('@hapi/hoek');
const Joi = require('joi');

const Parameters = require('../lib/parameters');
const Definitions = require('../lib/definitions');
const Properties = require('../lib/properties');
const Responses = require('../lib/responses');
const Utilities = require('../lib/utilities');

const internals = {};

exports =
  module.exports =
  internals.paths =
    function (settings) {
      this.settings = settings;
      this.definitions = new Definitions(settings);
      this.properties = new Properties(settings, {}, {});
      this.responses = new Responses(settings, {}, {});

      this.defaults = {
        responses: {}
      };

      this.schema = Joi.object({
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
        schemes: Joi.array().items(Joi.string().valid('http', 'https', 'ws', 'wss')),
        deprecated: Joi.boolean(),
        security: Joi.array().items(Joi.object())
      });
    };

/**
 * build the swagger path section
 *
 * @param  {Array} routes
 * @return {Object}
 */
internals.paths.prototype.build = function (routes) {
  const self = this;

  const routesData = [];

  // loop each route
  routes.forEach((route) => {
    const routeOptions = Hoek.reach(route, 'settings.plugins.@timondev/hapi-swagger') || {};
    const routeData = internals.createRouteMetaData(route, routeOptions);

    Utilities.assignVendorExtensions(routeData, routeOptions);
    routeData.path = Utilities.replaceInPath(routeData.path, ['endpoints'], this.settings.pathReplacements);

    // user configured interface through route plugin options
    if (Hoek.reach(routeOptions, 'validate.query')) {
      routeData.queryParams = Utilities.toJoiObject(Hoek.reach(routeOptions, 'validate.query'));
    }

    if (Hoek.reach(routeOptions, 'validate.params')) {
      routeData.pathParams = Utilities.toJoiObject(Hoek.reach(routeOptions, 'validate.params'));
    }

    if (Hoek.reach(routeOptions, 'validate.headers')) {
      routeData.headerParams = Utilities.toJoiObject(Hoek.reach(routeOptions, 'validate.headers'));
    }

    if (Hoek.reach(routeOptions, 'validate.payload')) {
      // has different structure, just pass straight through
      routeData.payloadParams = Hoek.reach(routeOptions, 'validate.payload');
      // if its a native javascript object convert it to JOI
      if (!Utilities.isJoi(routeData.payloadParams)) {
        routeData.payloadParams = Joi.object(routeData.payloadParams);
      }
    }

    // swap out any custom validation function for Joi object/string
    ['queryParams', 'pathParams', 'headerParams', 'payloadParams'].forEach((property) => {
      // swap out any custom validation function for Joi object/string
      if (Utilities.isFunction(routeData[property])) {
        if (property !== 'pathParams') {
          self.settings.log(
            ['validation', 'warning'],
            'Using a Joi.function for a query, header or payload is not supported.'
          );

          routeData[property] =
            property === 'payloadParams'
              ? Joi.object().label('Hidden Model')
              : Joi.object({ 'Hidden Model': Joi.string() });
        } else {
          self.settings.log(
            ['validation', 'error'],
            'Using a Joi.function for a params is not supported and has been removed.'
          );
          routeData[property] = null;
        }
      }
    });

    routesData.push(...internals.getMultiMethodRoutes(routeData, self.settings.wildcardMethods));
  });

  return this.buildRoutes(routesData);
};

/**
 * Create route meta data
 * @param {Object} route
 * @param {Object} routeOptions
 * @returns {Object}
 */
internals.createRouteMetaData = function (route, routeOptions) {
  return {
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
};

/**
 * Handle the case when route's method is declared with wildcard syntax
 * @param {Object} route
 * @param {Array<string>} wildcardMethods
 * @returns {*[]}
 */
internals.getMultiMethodRoutes = function (route, wildcardMethods) {
  return route.method !== '*'
    ? [Hoek.clone(route)]
    : wildcardMethods.map((method) => {
        return {
          ...Hoek.clone(route),
          method
        };
      });
};

/**
 * build the swagger path section from hapi routes data
 *
 * @param  {Array} routes
 * @return {Object}
 */
internals.paths.prototype.buildRoutes = function (routes) {
  const self = this;
  const pathObj = {};
  const swagger = {
    definitions: {},
    'x-alt-definitions': {}
  };
  const definitionCache = [new WeakMap(), new WeakMap()];

  // reset properties
  this.properties = new Properties(this.settings, swagger.definitions, swagger['x-alt-definitions'], definitionCache);
  this.responses = new Responses(this.settings, swagger.definitions, swagger['x-alt-definitions'], definitionCache);

  routes.forEach((route) => {
    const method = route.method;
    let path = internals.removeBasePath(route.path, this.settings.basePath, this.settings.pathReplacements);
    const out = {
      summary: route.description,
      operationId: route.id || Utilities.createId(route.method, path),
      description: route.notes,
      parameters: [],
      consumes: [],
      produces: []
    };

    // tags in swagger are used for grouping
    if (this.settings.grouping === 'tags') {
      out.tags = (route.tags || []).filter(this.settings.tagsGroupingFilter);
    } else {
      out.tags = route.groups;
    }

    out.description = Array.isArray(route.notes) ? route.notes.join('<br/><br/>') : route.notes;

    if (route.security) {
      out.security = route.security;
    }

    // add user defined over automaticlly discovered
    if (this.settings.consumes || route.consumes) {
      out.consumes = internals.overload(this.settings.consumes, route.consumes);
    }

    if (this.settings.produces || route.produces) {
      out.produces = internals.overload(this.settings.produces, route.produces);
    }

    // set from plugin options or from route options
    const payloadType = internals.overload(this.settings.payloadType, route.payloadType);

    // build payload either with JSON or form input
    let payloadStructures = this.getDefaultStructures();
    const payloadJoi = route.payloadParams;
    if (payloadType.toLowerCase() === 'json') {
      // set as json
      payloadStructures = this.getSwaggerStructures(payloadJoi, 'body', true, false);
    } else {
      // set as formData
      if (Utilities.hasJoiChildren(payloadJoi)) {
        payloadStructures = this.getSwaggerStructures(payloadJoi, 'formData', false, false);
      } else {
        self.testParameterError(payloadJoi, 'payload form-urlencoded', path);
      }

      // add form data mimetype
      if (out.consumes.length === 0) {
        // change form mimetype based on meta property 'swaggerType'
        out.consumes = internals.hasFileType(route) ? ['multipart/form-data'] : ['application/x-www-form-urlencoded'];
      }
    }

    // set required true/false for each path params
    let pathStructures = this.getDefaultStructures();
    const pathJoi = route.pathParams;
    if (Utilities.hasJoiChildren(pathJoi)) {
      pathStructures = this.getSwaggerStructures(pathJoi, 'path', false, false);
      pathStructures.parameters.forEach((item) => {
        // add required based on path pattern {prama} and {prama?}
        if (item.required === undefined) {
          if (path.indexOf('{' + item.name + '}') > -1) {
            item.required = true;
          }

          if (path.indexOf('{' + item.name + '?}') > -1) {
            delete item.required;
          }
        }

        if (item.required === false) {
          delete item.required;
        }

        if (!item.required) {
          self.settings.log(
            ['validation', 'warning'],
            'The ' +
              path +
              ' params parameter {' +
              item.name +
              '} is set as optional. This will work in the UI, but is invalid in the swagger spec'
          );
        }
      });
    } else {
      self.testParameterError(pathJoi, 'params', path);
    }

    // removes ? from {prama?} after we have set required/optional for path params
    path = internals.cleanPathParameters(path);

    let headerStructures = this.getDefaultStructures();
    const headerJoi = route.headerParams;
    if (Utilities.hasJoiChildren(headerJoi)) {
      headerStructures = this.getSwaggerStructures(headerJoi, 'header', false, false);
    } else {
      self.testParameterError(headerJoi, 'headers', path);
    }

    // if the API has a user set accept header with a enum convert into the produces array
    if (this.settings.acceptToProduce === true) {
      headerStructures.parameters = headerStructures.parameters.filter((header) => {
        if (header.name.toLowerCase() === 'accept') {
          if (header.enum) {
            out.produces = Utilities.sortFirstItem(header.enum, header.default);
            return false;
          }
        }

        return true;
      });
    }

    let queryStructures = this.getDefaultStructures();
    const queryJoi = route.queryParams;
    if (Utilities.hasJoiChildren(queryJoi)) {
      queryStructures = this.getSwaggerStructures(queryJoi, 'query', false, false);
    } else {
      self.testParameterError(queryJoi, 'query', path);
    }

    out.parameters = out.parameters.concat(
      headerStructures.parameters,
      pathStructures.parameters,
      queryStructures.parameters,
      payloadStructures.parameters
    );

    // if the api sets the content-type header pramater use that
    if (internals.hasContentTypeHeader(out)) {
      delete out.consumes;
    }

    //const name = out.operationId + method;
    //userDefindedSchemas, defaultSchema, statusSchemas, useDefinitions, isAlt
    out.responses = this.responses.build(route.responses, route.responseSchema, route.responseStatus, true, false);

    if (route.order) {
      out['x-order'] = route.order;
    }

    Utilities.assignVendorExtensions(out, route);

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
 * overload one object with another
 *
 * @param  {Object} base
 * @param  {Object} priority
 * @return {Object}
 */
internals.overload = function (base, priority) {
  return priority ? priority : base;
};

/**
 * does route have property swaggerType of file
 *
 * @param  {Object} route
 * @return {Boolean}
 */
internals.hasFileType = function (route) {
  const payloadParamsString = JSON.stringify(route.payloadParams, (key, value) => {
    // _currentJoi is a circular reference, introduced in Joi v11.0.0
    return key === '_currentJoi' ? undefined : value;
  });
  return payloadParamsString.includes('swaggerType');
};

/**
 * clear path parameters of optional char flag
 *
 * @param  {string} path
 * @return {string}
 */
internals.cleanPathParameters = function (path) {
  return path.replace('?}', '}');
};

/**
 * remove the base path from endpoint
 *
 * @param  {string} path
 * @param  {string} basePath
 * @param  {Array} pathReplacements
 * @return {string}
 */
internals.removeBasePath = function (path, basePath, pathReplacements) {
  if (basePath !== '/' && path.startsWith(basePath)) {
    path = path.replace(basePath, '');
    path = Utilities.replaceInPath(path, ['endpoints'], pathReplacements);
  }

  return path;
};

/**
 * does path parameters have a content-type header
 *
 * @param  {string} path
 * @return {boolean}
 */
internals.hasContentTypeHeader = function (path) {
  return path.parameters.some(
    (parameter) => parameter.in === 'header' && parameter.name.toLowerCase() === 'content-type'
  );
};

/**
 * builds an object containing different swagger structures that can be use to represent one object
 *
 * @param  {Object} joiObj
 * @param  {string} parameterType
 * @param  {Boolean} useDefinitions
 * @param  {Boolean} isAlt
 * @return {Object}
 */
internals.paths.prototype.getSwaggerStructures = function (joiObj, parameterType, useDefinitions, isAlt) {
  let outProperties;
  let outParameters;

  if (joiObj) {
    // name, joiObj, parent, parameterType, useDefinitions, isAlt
    outProperties = this.properties.parseProperty(null, joiObj, null, parameterType, useDefinitions, isAlt);
    outParameters = Parameters.fromProperties(outProperties, parameterType);
  }

  return {
    properties: outProperties || {},
    parameters: outParameters || []
  };
};

internals.paths.prototype.getDefaultStructures = function () {
  return {
    properties: {},
    parameters: []
  };
};

internals.paths.prototype.testParameterError = function (joiObj, parameterType, path) {
  if (joiObj && !Utilities.hasJoiChildren(joiObj)) {
    this.settings.log(
      ['validation', 'error'],
      'The ' + path + ' route ' + parameterType + ' parameter was set, but not as a Joi.object() with child properties'
    );
  }
};
