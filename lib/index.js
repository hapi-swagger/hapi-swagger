'use strict';
const Hoek = require('hoek');
const Joi = require('joi');
const Path = require('path');
const Querystring = require('querystring');
const Url = require('url');

const Pack = require('../package.json');
const Builder = require('../lib/builder');
const Utilities = require('../lib/utilities');


// schema for plug-in properties
const schema = Joi.object({
    debug: Joi.boolean(),
    jsonPath: Joi.string(),
    documentationPath: Joi.string(),
    swaggerUIPath: Joi.string(),
    auth: Joi.alternatives().try(Joi.boolean(), Joi.string(), Joi.object()),
    suppressVersionFromBasePath: Joi.boolean(),
    pathPrefixSize: Joi.number().integer().positive(),
    payloadType: Joi.string().valid(['form', 'json']),
    enableDocumentation: Joi.boolean(),
    enableSwaggerUI: Joi.boolean(),
    jsonEditor: Joi.boolean(),
    expanded: Joi.string().valid(['none', 'list', 'full']),
    lang: Joi.string().valid(['en', 'es', 'fr', 'it', 'ja', 'pl', 'pt', 'ru', 'tr','zh-cn']),
    sortTags: Joi.string().valid(['default', 'name']),
    sortEndpoints: Joi.string().valid(['path', 'method', 'ordered']),
    sortPaths: Joi.string().valid(['unsorted', 'path-method']),
    addXProperties: Joi.boolean(),
    derefJSONSchema: Joi.boolean(),
    validatorUrl: Joi.string().allow( null ),
    acceptToProduce: Joi.boolean(),
    connectionLabel: Joi.array().items(Joi.string()).single().allow(null),
    pathReplacements: Joi.array().items(Joi.object({
        replaceIn: Joi.string().valid(['groups', 'endpoints', 'all']),
        pattern: Joi.object().type(RegExp),
        replacement: Joi.string().allow('')
    }))
}).unknown();


// defaults settings for plug-in
const defaults = {
    'debug': false,
    'jsonPath': '/swagger.json',
    'documentationPath': '/documentation',
    'swaggerUIPath': '/swaggerui/',
    'auth': false,
    'suppressVersionFromBasePath': false,
    'pathPrefixSize': 1,
    'payloadType': 'json',
    'enableDocumentation': true,
    'enableSwaggerUI': true,
    'jsonEditor': false,
    'expanded': 'list',   //none, list or full
    'lang': 'en',
    'sortTags': 'default',
    'sortEndpoints': 'path',
    'sortPaths': 'unsorted',
    'addXProperties': false,
    'derefJSONSchema': false,
    'validatorUrl': '//online.swagger.io/validator',
    'acceptToProduce': true,
    'connectionLabel': null,
    'pathReplacements': []
};


/**
 * register the plug-in with the Hapi framework
 *
 * @param  {Object} plugin
 * @param  {Object} options
 * @param  {function} next
 */
exports.register = function (plugin, options, next) {

    let settings = Hoek.applyToDefaults(defaults, options, true);
    const publicDirPath = Path.resolve(__dirname, '..', 'public');
    const swaggerDirPath = Path.join(publicDirPath, 'swaggerui');
    let isInitialized = false; // boolean flag to indicate if plugin is already initialized

    // add server method for caching
    if (settings.cache) {
        // set defaults
        settings.cache.segment = 'hapi-swagger';
        if (!settings.cache.generateTimeout) {
            settings.cache.generateTimeout = 30 * 1000;
        }

        plugin.method('getSwaggerJSON', Builder.getSwaggerJSON, {
            cache: settings.cache,
            generateKey: () => {

                return 'hapi-swagger';
            }
        });
    }


    // add routing swagger json
    plugin.route([{
        method: 'GET',
        path: settings.jsonPath,
        config: {
            auth: settings.auth,
            handler: (request, reply) => {

                Joi.assert(settings, schema);

                if (settings.cache) {
                    /*eslint no-unused-vars:0 */
                    plugin.methods.getSwaggerJSON(settings, request, (err, json, cached, report) => {

                        /* $lab:coverage:off$ */
                        if (err) {
                            reply(err);
                            /* $lab:coverage:on$ */
                        } else {
                            //console.log(JSON.stringify(report));
                            const lastModified = cached ? new Date(cached.stored) : new Date();
                            reply(json).header('last-modified', lastModified.toUTCString());
                        }
                    });
                } else {
                    Joi.assert(settings, schema);
                    Builder.getSwaggerJSON(settings, request, (err, json) => {

                        reply(json);
                    });
                }
            },
            plugins: {
                'hapi-swagger': false
            }
        }
    }]);


    // only add 'inert' and 'vision' based routes if needed
    if (settings.enableDocumentation === true || settings.enableSwaggerUI === true) {

        // make sure we have other plug-in dependencies
        plugin.dependency(['inert', 'vision'], (pluginWithDependencies, nextWithDependencies) => {

            // check if plugin is already initialized
            if (isInitialized === true) {
                nextWithDependencies();
                return; // exit
            }

            // add routing for swaggerui static assets /swaggerui/
            pluginWithDependencies.views({
                engines: {
                    html: {
                        module: require('handlebars')
                    }
                },
                path: swaggerDirPath
            });

            // add documentation page
            if (settings.enableDocumentation === true) {
                pluginWithDependencies.route([{
                    method: 'GET',
                    path: settings.documentationPath,
                    config: {
                        auth: settings.auth
                    },
                    handler: (request, reply) => {

                        reply.view('index.html', {});
                    }
                }]);
            }

            // add swagger UI if asked for or need by documentation page
            if (settings.enableDocumentation === true || settings.enableSwaggerUI === true) {
                pluginWithDependencies.route([{
                    method: 'GET',
                    path: settings.swaggerUIPath + '{path*}',
                    config: {
                        auth: settings.auth
                    },
                    handler: {
                        directory: {
                            path: swaggerDirPath + Path.sep,
                            listing: true,
                            index: false
                        }
                    }
                }, {
                    method: 'GET',
                    path: settings.swaggerUIPath + 'extend.js',
                    config: {
                        auth: settings.auth,
                        files: {
                            relativeTo: publicDirPath
                        }
                    },
                    handler: {
                        file: 'extend.js'
                    }
                }]);
            }

            // add debug page
            if (settings.debug === true) {
                pluginWithDependencies.route([{
                    method: 'GET',
                    path: settings.documentationPath + Path.sep + 'debug',
                    config: {
                        auth: settings.auth
                    },
                    handler: (request, reply) => {

                        reply.view('debug.html', {}).type('application/json');
                    }
                }]);
            }

            appendDataContext(pluginWithDependencies, settings);
            isInitialized = true; // flag plugin as initialized

            nextWithDependencies();

        });
    }

    // TODO: need to work how to test this as it need a request object
    // Undocument API interface, it may change
    /* $lab:coverage:off$ */
    plugin.expose('getJSON', function (exposeOptions, request, callback) {

        // use either options passed to function or plug-in scope options
        let exposeSettings = {};
        if (exposeOptions && Utilities.hasProperties(exposeOptions)) {
            exposeSettings = Hoek.applyToDefaults(defaults, exposeOptions);
            Joi.assert(exposeSettings, schema);
        } else {
            exposeSettings = Hoek.clone(settings);
        }
        Builder.getSwaggerJSON(exposeSettings, request, callback);
    });
    /* $lab:coverage:on$ */


    next();
};


/**
 * attributes for plug-in uses 'name' and 'version' from package.json files
 */
exports.register.attributes = {
    name: Pack.name,
    version: Pack.version,
    once: true,
    multiple: false
};


/**
 * appends settings data in template context
 *
 * @param  {Object} plugin
 * @param  {Object} settings
 * @return {Object}
 */
const appendDataContext = function (plugin, settings) {

    plugin.ext('onPostHandler', (request, reply) => {

        let response = request.response;
        // if the reply is a view add settings data into template system
        if (response.variety === 'view') {

            // Added to fix bug that cannot yet be reproduced in test - REVIEW
            /* $lab:coverage:off$ */
            if (!response.source.context) {
                response.source.context = {};
            }
            /* $lab:coverage:on$ */

            // append tags from document request to JSON request
            if (request.query.tags) {
                settings.jsonPath = appendQueryString(settings.jsonPath, 'tags', request.query.tags);
            } else {
                settings.jsonPath = appendQueryString(settings.jsonPath, null, null);
            }

            const prefixedSettings = Hoek.clone(settings);
            if (plugin.realm.modifiers.route.prefix) {
                ['jsonPath', 'swaggerUIPath'].forEach((setting) => {
                    prefixedSettings[setting] = plugin.realm.modifiers.route.prefix + prefixedSettings[setting];
                });
            }
            const prefix = findAPIKeyPrefix(settings);
            if (prefix) {
                prefixedSettings.keyPrefix = prefix;
            }
            prefixedSettings.stringified = JSON.stringify(prefixedSettings);

            response.source.context.hapiSwagger = prefixedSettings;
        }
        return reply.continue();
    });
};


/**
 * appends a querystring to a url path - will overwrite existings values
 *
 * @param  {String} url
 * @param  {String} qsName
 * @param  {String} qsValue
 * @return {String}
 */
const appendQueryString = function (url, qsName, qsValue) {

    let urlObj = Url.parse(url);
    if (qsName && qsValue) {
        urlObj.query = Querystring.parse(qsName + '=' + qsValue);
        urlObj.search = '?' + encodeURIComponent(qsName) + '=' + encodeURIComponent(qsValue);
    } else {
        urlObj.search = '';
    }
    return urlObj.format(urlObj);
};


/**
 * finds any keyPrefix in securityDefinitions - also add x- to name
 *
 * @param  {Object} settings
 * @return {String}
 */
const findAPIKeyPrefix = function (settings) {

    let out = '';
    if (settings.securityDefinitions) {
        Object.keys(settings.securityDefinitions).forEach((key) => {

            if (settings.securityDefinitions[key]['x-keyPrefix']) {
                out = settings.securityDefinitions[key]['x-keyPrefix'];
            }
        });
    }
    return out;
};
