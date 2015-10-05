
//'use strict';
var Hoek        = require('hoek'),
    Boom        = require('boom'),
    Joi         = require('joi'),
    Path        = require('path'),
    builder     = require('../lib/json-builder'),
    schemas     = require('../lib/schemas');

var defaultOptions = {
        auth: false,
        basePath: '',
        protocol: null, 
        documentationPath: '/documentation',
        jsonPath: '/swagger.json',
        swaggeruiPath: '/swaggerui/'
    };


exports.register = function (plugin, options, next) {

    var settings = Hoek.applyToDefaults(defaultOptions, options || {}),
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
        config: swaggerJSONConfig(settings)
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
        path: settings.swaggeruiPath + '{path*}',
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



    // append settings data in template context
    appendDataContext( plugin, settings );  


    next();
};


exports.register.attributes = {
   /* name: 'hapi-swagger',
    version: '1.0.0'*/
    pkg: require('../package.json')
};



// append settings data in template context
appendDataContext = function ( plugin, settings ) {
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



// builds hapi route config for swagger JSON
swaggerJSONConfig = function( options ){
    return {
        auth: options.auth,
        handler: function (request, reply) {
            reply(builder.getSwaggerJSON( options ))
        },
        plugins: {
            "hapi-swagger": false
        }
    }
}
