'use strict';
const Hoek = require('hoek');
const Joi = require('joi');
const Path = require('path');
const Querystring = require('querystring');
const Url = require('url');

const Pack = require('../package.json');
const Defaults = require('../lib/defaults');
const Builder = require('../lib/builder');
const Utilities = require('../lib/utilities');


// schema for plug-in properties
const schema = Joi.object({
    debug: Joi.boolean(),
    jsonPath: Joi.string(),
    documentationPath: Joi.string(),
    swaggerUIPath: Joi.string(),
    auth: Joi.alternatives().try(Joi.boolean(), Joi.string(), Joi.object()),
    pathPrefixSize: Joi.number().integer().positive(),
    payloadType: Joi.string().valid(['form', 'json']),
    documentationPage: Joi.boolean(),
    swaggerUI: Joi.boolean(),
    jsonEditor: Joi.boolean(),
    expanded: Joi.string().valid(['none', 'list', 'full']),
    lang: Joi.string().valid(['en', 'es', 'fr', 'it', 'ja', 'pl', 'pt', 'ru', 'tr', 'zh-cn']),
    sortTags: Joi.string().valid(['default', 'name']),
    sortEndpoints: Joi.string().valid(['path', 'method', 'ordered']),
    sortPaths: Joi.string().valid(['unsorted', 'path-method']),
    uiCompleteScript: Joi.string().allow(null),
    xProperties: Joi.boolean(),
    reuseDefinitions: Joi.boolean(),
    deReference: Joi.boolean(),
    validatorUrl: Joi.string().allow(null),
    acceptToProduce: Joi.boolean(),
    connectionLabel: Joi.array().items(Joi.string()).single().allow(null),
    cors: Joi.boolean(),
    pathReplacements: Joi.array().items(Joi.object({
        replaceIn: Joi.string().valid(['groups', 'endpoints', 'all']),
        pattern: Joi.object().type(RegExp),
        replacement: Joi.string().allow('')
    }))
}).unknown();




/**
 * register the plug-in with the Hapi framework
 *
 * @param  {Object} plugin
 * @param  {Object} options
 * @param  {Function} next
 */
exports.register = function (plugin, options, next) {


    let settings = Hoek.applyToDefaults(Defaults, options, true);
    const publicDirPath = Path.resolve(__dirname, '..', 'public');
    const swaggerDirPath = Path.join(publicDirPath, 'swaggerui');

    settings.log = (tags, data) => {

        tags.unshift('hapi-swagger');
        if (settings.debug) {
            plugin.log(tags, data);
        }
    };
    settings.log(['info'], 'Started');

    // add server method for caching
    if (settings.cache) {
        // set default
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
            cors: settings.cors,
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
    if (settings.documentationPage === true || settings.swaggerUI === true) {

        // make sure we have other plug-in dependencies
        plugin.dependency(['inert', 'vision'], (pluginWithDependencies, nextWithDependencies) => {

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
            if (settings.documentationPage === true) {
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
            if (settings.documentationPage === true || settings.swaggerUI === true) {
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
                    path: Path.join(settings.documentationPath, Path.sep, 'debug').split(Path.sep).join('/'),
                    config: {
                        auth: settings.auth
                    },
                    handler: (request, reply) => {

                        reply.view('debug.html', {}).type('application/json');
                    }
                }]);
            }

            appendDataContext(pluginWithDependencies, settings);

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
            exposeSettings = Hoek.applyToDefaults(Defaults, exposeOptions);
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
