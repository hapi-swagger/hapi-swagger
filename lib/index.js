'use strict';
const Hoek = require('hoek');
const Joi = require('joi');
const Path = require('path');
const Querystring = require('querystring');
const Url = require('url');

const builder = require('../lib/builder');



// schema for plug-in properties
const schema = Joi.object({
    jsonPath: Joi.string(),
    documentationPath: Joi.string(),
    swaggerUIPath: Joi.string(),
    auth: Joi.boolean(),
    pathPrefixSize: Joi.number().integer().positive(),
    payloadType: Joi.string().valid(['form', 'json']),
    enableDocumentation: Joi.boolean(),
    expanded: Joi.string().valid(['none', 'list', 'full']),
    lang: Joi.string().valid(['en', 'es', 'pt', 'ru']),
    sortPaths: Joi.string().valid(['unsorted', 'path-method']),
    addXProperties: Joi.boolean(),
    derefJSONSchema: Joi.boolean()
}).unknown();



// defaults settings for plug-in
const defaults = {
    'jsonPath': '/swagger.json',
    'documentationPath': '/documentation',
    'swaggerUIPath': '/swaggerui/',
    'auth': false,
    'pathPrefixSize': 1,
    'payloadType': 'json',
    'enableDocumentation': true,
    'expanded': 'list',   //none, list or full
    'lang': 'en',
    'sortPaths': 'unsorted',
    'addXProperties': false,
    'derefJSONSchema': false
};


/**
 * register the plug-in with the Hapi framework
 *
 * @param  {Object} plugin
 * @param  {Object} options
 * @param  {function} next
 */
exports.register = function (plugin, options, next) {

    const settings = Hoek.applyToDefaults(defaults, options);
    const swaggerDirPath = __dirname + Path.sep + '..' + Path.sep + 'public' + Path.sep + 'swaggerui';

    // add routing swagger json
    plugin.route([{
        method: 'GET',
        path: settings.jsonPath,
        config: {
            auth: settings.auth,
            handler: (request, reply) => {

                Joi.assert(settings, schema);
                builder.getSwaggerJSON(settings, request, function (err, json) {

                    reply(json).type('application/json');
                });
            },
            plugins: {
                'hapi-swagger': false
            }
        }
    }]);


    // add routing for swagger ui
    if (settings.enableDocumentation === true) {

        // There is no way to cover this differs from Hapi 9 to 10+
        /* $lab:coverage:off$ */
        if (plugin.registrations){
            Hoek.assert(plugin.registrations.vision, 'Missing vision plug-in registation');
            Hoek.assert(plugin.registrations.inert, 'Missing inert plug-in registation');
        }
        /* $lab:coverage:on$ */

        // add routing for swaggerui static assets /swaggerui/
        plugin.views({
            engines: {
                html: {
                    module: require('handlebars')
                }
            },
            path: swaggerDirPath
        });

        plugin.route([{
            method: 'GET',
            path: settings.documentationPath,
            config: {
                auth: settings.auth
            },
            handler: (request, reply) => {

                reply.view('index.html', {});
            }
        },{
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
        }]);
    }

    appendDataContext(plugin, settings);
    next();
};


/**
 * attributes for plug-in uses 'name' and 'version' from package.json files
 */
exports.register.attributes = {
    pkg: require('../package.json')
};


/**
 * appends settings data in template context
 *
 * @param  {Object} plugin
 * @param  {Object} options
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
            }
            response.source.context.hapiSwagger = settings;
        }
        return reply.continue();
    });
};


/**
 * appends a querystring to a url path - will overright existings values
 *
 * @param  {String} url
 * @param  {String} qsName
 * @param  {String} qsValue
 * @return {String}
 */
const appendQueryString = function (url, qsName, qsValue) {

    let urlObj = Url.parse(url);
    urlObj.query = Querystring.parse(qsName + '=' + qsValue);
    return urlObj.format(urlObj);
};
