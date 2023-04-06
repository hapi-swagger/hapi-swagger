const Hoek = require('@hapi/hoek');
const Joi = require('joi');
const Path = require('path');
const { join, sep } = require('path');
const swaggerUiAssetPath = require('swagger-ui-dist').getAbsoluteFSPath();

const Pack = require('../package.json');
const Defaults = require('../lib/defaults');
const Builder = require('../lib/builder');
const Utilities = require('../lib/utilities');

// schema for plug-in properties
const schema = Joi.object({
  debug: Joi.boolean(),
  jsonPath: Joi.string(),
  jsonRoutePath: Joi.string(),
  documentationPath: Joi.string(),
  documentationRouteTags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
  documentationRoutePlugins: Joi.object().default({}),
  templates: Joi.string(),
  swaggerUIPath: Joi.string(),
  routesBasePath: Joi.string(),
  auth: Joi.alternatives().try(Joi.boolean(), Joi.string(), Joi.object()),
  pathPrefixSize: Joi.number().integer().positive(),
  payloadType: Joi.string().valid('form', 'json'),
  documentationPage: Joi.boolean(),
  swaggerUI: Joi.boolean(),
  expanded: Joi.string().valid('none', 'list', 'full'),
  sortTags: Joi.string().valid('alpha'),
  sortEndpoints: Joi.string().valid('alpha', 'method', 'ordered'),
  sortPaths: Joi.string().valid('unsorted', 'path-method'),

  // patch: uiCompleteScript -- Define validation scope
  //        to have another ability, you may use plain js script as "string"
  //        or use external file by describe it as { src: 'URL' }
  //        you may provide external js file as URL from static route,
  //        eg: '/assets/js/doc-patch.js'
  uiCompleteScript: Joi.alternatives(
    Joi.string(),
    Joi.object().keys({
      src: Joi.string().required()
    })
  ).allow(null),
  xProperties: Joi.boolean(),
  reuseDefinitions: Joi.boolean(),
  wildcardMethods: Joi.array().items(Joi.string().not('HEAD', 'OPTIONS')), // OPTIONS not supported by Swagger and HEAD not support by Hapi
  definitionPrefix: Joi.string(),
  deReference: Joi.boolean(),
  deReferenceArrays: Joi.boolean(),
  validatorUrl: Joi.string().allow(null),
  acceptToProduce: Joi.boolean(),
  cors: Joi.boolean(),
  pathReplacements: Joi.array().items(
    Joi.object({
      replaceIn: Joi.string().valid('groups', 'endpoints', 'all'),
      pattern: Joi.object().instance(RegExp),
      replacement: Joi.string().allow('')
    })
  ),
  routeTag: Joi.alternatives(Joi.string(), Joi.function()),
  // validate as declared in @hapi/hapi
  // https://github.com/hapijs/hapi/blob/5c0850989f2b7270fe7a7b6a7d4ebdc9a7fecd79/lib/config.js#L220
  validate: Joi.object({
    headers: Joi.alternatives(Joi.object(), Joi.array(), Joi.function()).allow(null, true),
    params: Joi.alternatives(Joi.object(), Joi.array(), Joi.function()).allow(null, true),
    query: Joi.alternatives(Joi.object(), Joi.array(), Joi.function()).allow(null, false, true),
    payload: Joi.alternatives(Joi.object(), Joi.array(), Joi.function()).allow(null, false, true),
    state: Joi.alternatives(Joi.object(), Joi.array(), Joi.function()).allow(null, false, true),
    failAction: Joi.alternatives([Joi.valid('error', 'log', 'ignore'), Joi.function()]),
    errorFields: Joi.object(),
    options: Joi.object(),
    validator: Joi.object()
  }),
  tryItOutEnabled: Joi.boolean()
}).unknown();

/**
 * register the plug-in with the Hapi framework
 *
 * @param  {Object} plugin
 * @param  {Object} options
 * @param  {Function} next
 */
exports.plugin = {
  name: Pack.name,
  version: Pack.version,
  multiple: true,

  register: (server, options) => {
    // `options.validate` might not be present but it should not be set in the
    // `Defaults` since it would always override the server-level defaults.
    // It should be overwritten only if explicitly passed to the plugin options.
    const validateOption = { validate: options.validate };
    const settings = Hoek.applyToDefaults(Defaults, options, { nullOverride: true });
    const publicDirPath = Path.resolve(__dirname, '..', 'public');

    // avoid breaking behaviour with previous version
    if (!options.routesBasePath && options.swaggerUIPath) {
      settings.routesBasePath = options.swaggerUIPath;
    }

    if (!options.jsonRoutePath && options.jsonPath) {
      settings.jsonRoutePath = options.jsonPath;
    }

    settings.log = (tags, data) => {
      tags.unshift('@timondev/hapi-swagger');
      if (settings.debug) {
        server.log(tags, data);
      }
    };

    settings.log(['info'], 'Started');

    // add server method for caching
    if (settings.cache && !server.methods.getSwaggerJSON) {
      // set default
      settings.cache.segment = '@timondev/hapi-swagger';
      settings.cache.getDecoratedValue = true;
      if (!settings.cache.generateTimeout) {
        settings.cache.generateTimeout = 30 * 1000;
      }

      const getSwaggerJSON = Builder.getSwaggerJSON;

      // If you need access to the cache result envelope information { value, ttl, report },
      // use the catbox getDecoratedValue option.
      const options = {
        cache: settings.cache,
        generateKey: (settings, request) => '@timondev/hapi-swagger-' + request.path
      };
      server.method('getSwaggerJSON', getSwaggerJSON, options);
    }

    // patch: uiCompleteScript -- Implementing
    //        mutate the uiCompleteScript before render into h.views
    if (
      settings.uiCompleteScript !== '' &&
      settings.uiCompleteScript !== null &&
      typeof settings.uiCompleteScript === 'object'
    ) {
      settings.uiCompleteScript = `
        const s = document.createElement('script');
        s.src = '${settings.uiCompleteScript.src}';
        s.type = 'text/javascript';
        document.body.appendChild(s);
      `;
    }

    Joi.assert(settings, schema);

    // add routing swagger json
    server.route([
      {
        method: 'GET',
        path: settings.jsonRoutePath,
        options: Hoek.applyToDefaults(
          {
            auth: settings.auth,
            cors: settings.cors,
            tags: settings.documentationRouteTags,
            handler: async (request, h) => {
              if (settings.cache) {
                const { cached, value } = await server.methods.getSwaggerJSON(settings, request);
                const lastModified = cached ? new Date(cached.stored) : new Date();
                return h.response(value).header('last-modified', lastModified.toUTCString());
              }

              const json = await Builder.getSwaggerJSON(settings, request);
              return json;
            },
            plugins: {
              '@timondev/hapi-swagger': false
            }
          },
          validateOption
        )
      }
    ]);

    // only add '@hapi/inert' and '@hapi/vision' based routes if needed
    if (settings.documentationPage === true || settings.swaggerUI === true) {
      server.dependency(['@hapi/inert', '@hapi/vision'], (server) => {
        // Setup vision using handlebars from the templates directory
        server.views({
          engines: {
            html: require('handlebars')
          },
          path: settings.templates
        });

        // add documentation page
        if (settings.documentationPage === true) {
          server.route([
            {
              method: 'GET',
              path: settings.documentationPath,
              options: Hoek.applyToDefaults(
                {
                  auth: settings.auth,
                  tags: settings.documentationRouteTags,
                  handler: (request, h) => {
                    return h.view('index', {});
                  },
                  plugins: settings.documentationRoutePlugins
                },
                validateOption
              )
            }
          ]);
        }

        // add swagger UI if asked for or need by documentation page
        if (settings.documentationPage === true || settings.swaggerUI === true) {
          const filesToServe = [
            'favicon-16x16.png',
            'favicon-32x32.png',
            'index.html',
            'oauth2-redirect.html',
            'swagger-ui-bundle.js',
            'swagger-ui-bundle.js.map',
            'swagger-ui-standalone-preset.js',
            'swagger-ui-standalone-preset.js.map',
            'swagger-ui.css',
            'swagger-ui.css.map',
            'swagger-ui.js',
            'swagger-ui.js.map'
          ];
          filesToServe.forEach((filename) => {
            server.route({
              method: 'GET',
              path: `${settings.routesBasePath}${filename}`,
              options: Hoek.applyToDefaults(
                {
                  auth: settings.auth,
                  tags: settings.documentationRouteTags,
                  files: {
                    relativeTo: swaggerUiAssetPath
                  }
                },
                validateOption
              ),
              handler: {
                file: `${filename}`
              }
            });
          });

          server.route({
            method: 'GET',
            path: settings.routesBasePath + 'extend.js',
            options: Hoek.applyToDefaults(
              {
                tags: settings.documentationRouteTags,
                auth: settings.auth,
                files: {
                  relativeTo: publicDirPath
                },
                handler: {
                  file: 'extend.js'
                }
              },
              validateOption
            )
          });
        }

        // add debug page
        if (settings.debug === true) {
          server.route([
            {
              method: 'GET',
              path: join(settings.documentationPath, sep, 'debug').split(sep).join('/'),
              options: Hoek.applyToDefaults(
                {
                  auth: settings.auth,
                  tags: settings.documentationRouteTags,
                  handler: (request, h) => {
                    return h.view('debug.html', {}).type('application/json');
                  },
                  plugins: settings.documentationRoutePlugins
                },
                validateOption
              )
            }
          ]);
        }

        appendDataContext(server, settings);
      });
    }

    // TODO: need to work how to test this as it need a request object
    // Undocumented API interface, it may change
    /* $lab:coverage:off$ */
    server.expose('getJSON', (exposeOptions, request, callback) => {
      // use either options passed to function or plug-in scope options
      let exposeSettings = {};
      if (exposeOptions && Utilities.hasProperties(exposeOptions)) {
        exposeSettings = Hoek.applyToDefaults(Defaults, exposeOptions);
        Joi.assert(exposeSettings, schema);
      } else {
        exposeSettings = Hoek.clone(settings);
      }

      return Builder.getSwaggerJSON(exposeSettings, request, callback);
    });
    /* $lab:coverage:on$ */
  }
};

/**
 * appends settings data in template context
 *
 * @param  {Object} plugin
 * @param  {Object} settings
 * @return {Object}
 */
const appendDataContext = function (plugin, settings) {
  plugin.ext('onPostHandler', (request, h) => {
    const response = request.response;
    const routePrefix = plugin.realm.modifiers.route.prefix;

    // if the reply is a view add settings data into template system
    if (response.variety === 'view') {
      // skip if the request is not for this handler
      if (routePrefix && !request.path.startsWith(routePrefix)) {
        return h.continue;
      }

      // Added to fix bug that cannot yet be reproduced in test - REVIEW
      /* $lab:coverage:off$ */
      if (!response.source.context) {
        response.source.context = {};
      }
      /* $lab:coverage:on$ */

      // append tags from document request to JSON request
      settings.jsonPath = request.query.tags
        ? Utilities.appendQueryString(settings.jsonPath, 'tags', request.query.tags)
        : Utilities.appendQueryString(settings.jsonPath);

      const prefixedSettings = Hoek.clone(settings);
      if (routePrefix) {
        ['jsonPath', 'swaggerUIPath'].forEach((setting) => {
          prefixedSettings[setting] = routePrefix + prefixedSettings[setting];
        });
      }

      // Need JWT plugin to work with Hapi v17+ to test this again

      const prefix = findAPIKeyPrefix(settings);
      if (prefix) {
        prefixedSettings.keyPrefix = prefix;
      }

      prefixedSettings.stringified = JSON.stringify(prefixedSettings);

      response.source.context.hapiSwagger = prefixedSettings;
    }

    return h.continue;
  });
};

/**
 * finds any keyPrefix in securityDefinitions - also add x- to name
 *
 * @param  {Object} settings
 * @return {string}
 */
const findAPIKeyPrefix = function (settings) {
  // Need JWT plugin to work with Hapi v17+ to test this again
  /* $lab:coverage:off$ */
  let out = '';
  if (settings.securityDefinitions) {
    Object.keys(settings.securityDefinitions).forEach((key) => {
      if (settings.securityDefinitions[key]['x-keyPrefix']) {
        out = settings.securityDefinitions[key]['x-keyPrefix'];
      }
    });
  }

  return out;
  /* $lab:coverage:on$ */
};
