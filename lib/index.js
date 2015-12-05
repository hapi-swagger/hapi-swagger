'use strict';
var Hoek = require('hoek'),
    Path = require('path'),
    Querystring = require('querystring'),
    Url = require('url');

var builder = require('../lib/builder');


/*
// schema for plug-in root properties
var schema = Joi.object({
    jsonPath: Joi.string(),
    documentationPath: Joi.string(),
    swaggerUIPath: Joi.string(),
    auth: Joi.boolean(),
    pathPrefixSize: Joi.number().integer().positive(),
    payloadType: Joi.string().valid(['form', 'json']),
    enableDocumentationPage: Joi.boolean(),
    expanded: Joi.string().valid(['none', 'list', 'full'])
});
*/


// defaults settings for plug-in
var defaults = {
    'jsonPath': '/swagger.json',
    'documentationPath': '/documentation',
    'swaggerUIPath': '/swaggerui/',
    'auth': false,
    'pathPrefixSize': 1,
    'payloadType': 'json',
    'enableDocumentationPage': true,
    'expanded': 'list',   //none, list or full
    'lang': 'en'
};


/**
 * register the plug-in with the Hapi framework
 *
 * @param  {Object} plugin
 * @param  {Object} options
 * @param  {function} next
 */
exports.register = function (plugin, options, next) {

    var settings = Hoek.applyToDefaults(defaults, options),
        swaggerDirPath = __dirname + Path.sep + '..' + Path.sep + 'public' + Path.sep + 'swaggerui';

    Hoek.assert(plugin.registrations.vision, 'Missing vision plug-in registation');
    Hoek.assert(plugin.registrations.inert, 'Missing inert plug-in registation');


    // add routing for swaggerui static assets /swaggerui/
    plugin.views({
        engines: {
            html: {
                module: require('handlebars')
            }
        },
        path: swaggerDirPath
    });

    // add routing swagger json
    plugin.route([{
        method: 'GET',
        path: settings.jsonPath,
        config: buildSwaggerJSON(settings)
    }]);


    // add routing for swagger ui
    if (settings.enableDocumentationPage === true) {
        plugin.route([{
            method: 'GET',
            path: settings.documentationPath,
            config: {
                auth: settings.auth
            },
            handler: function (request, reply) {

                reply.view('index.html', {});
            }
        }, {
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
var appendDataContext = function (plugin, settings) {

    plugin.ext('onPostHandler', function (request, reply) {

        var response = request.response;
        // if the reply is a view add settings data into template system
        if (response.variety === 'view') {
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
 * builds swagger JSON
 *
 * @param  {Object} settings
 * @return {Object}
 */
var buildSwaggerJSON = function (settings) {

    return {
        auth: settings.auth,
        handler: function (request, reply) {

            reply(builder.getSwaggerJSON(settings, request));
        },
        plugins: {
            'hapi-swagger': false
        }
    };
};


/**
 * appends a querystring to a url path - will overright existings values
 *
 * @param  {String} url
 * @param  {String} qsName
 * @param  {String} qsValue
 * @return {String}
 */
var appendQueryString = function (url, qsName, qsValue) {

    var urlObj = Url.parse(url);
    urlObj.query = Querystring.parse(qsName + '=' + qsValue);
    return urlObj.format(urlObj);
};
