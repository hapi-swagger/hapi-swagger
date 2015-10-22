
//'use strict';
var Hoek        = require('hoek'),
    Boom        = require('boom'),
    Joi         = require('joi'),
    Path        = require('path'),
    builder     = require('../lib/builder'),
    schemas     = require('../lib/schemas');


// defaults settings for plug-in
var defaults = {
        'jsonPath': '/swagger.json',
        'documentationPath': '/documentation',
        'swaggerUIPath': '/swaggerui/',
        'pathPrefixSize': 1,
        'payloadType': 'json'
    };

/**
 * register the plug-in with the Hapi framework
 *
 * @param  {Object} plugin
 * @param  {Object} options
 * @param  {function} next
 */
exports.register = function (plugin, options, next) {

    var settings = Hoek.applyToDefaults(defaults, options || {}),
        swaggerDirPath = __dirname + Path.sep + '..' + Path.sep + 'public' + Path.sep + 'swaggerui';

    // add routing for swaggerui static assets /swaggerui/
    plugin.views({
        engines: {
            html: {
                module: require('handlebars')
            }
        },
        path: swaggerDirPath
    });

    // add routing 
    plugin.route([{
        method: 'GET',
        path: settings.jsonPath,
        config: buildSwaggerJSON(settings)
    },{
        method: 'GET',
        path: settings.documentationPath,            
        config: {
          auth: settings.auth,
        },
        handler: function(request, reply) {
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

    appendDataContext( plugin, settings );  
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
function appendDataContext( plugin, settings ) {
    plugin.ext('onPostHandler', function (request, reply) {
        var response = request.response;
        // if the reply is a view add settings data into template system
        if (response.variety === 'view') {
            if(!response.source.context){
                response.source.context = {};
            }
            response.source.context['hapiSwagger'] = settings
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
function buildSwaggerJSON( settings ){
    return {
        auth: settings.auth,
        handler: function (request, reply) {
            reply(builder.getSwaggerJSON( settings, request ))
        },
        plugins: {
            "hapi-swagger": false
        }
    }
}
