'use strict';
var Hoek             = require('hoek'),
    Boom             = require('boom'),
    Joi              = require('joi'),
    Path             = require('path'),
    Url              = require('url'),
    Schemas          = require('../lib/schemas'),
    Definitions      = require('../lib/definitions'),
    Info             = require('../lib/info'),
    Paths            = require('../lib/paths'),
    Tags             = require('../lib/tags');


var builder = module.exports = {};


// default data for root object
builder.default = {
    'swagger': '2.0',
    'schemes': ['http'],
    'basePath': '/',
    'consumes': ['application/json'],
    'produces': ['application/json']
}

// schema for swagger root object
builder.schema = Joi.object({
    swagger: Joi.string().valid('2.0').required(),
    info: Joi.any(),
    host: Joi.string(),  // JOI hostname validator too strict 
    basePath: Joi.string().regex(/^\//),
    schemes: Joi.array().items(Joi.string().valid(['http', 'https', 'ws', 'wss'])),
    consumes: Joi.array().items(Joi.string()),
    produces: Joi.array().items(Joi.string()), 
    paths: Joi.any(),
    definitions: Joi.any(),
    parameters: Joi.any(),
    responses: Joi.any(),
    securityDefinitions: Joi.any(),
    security: Joi.any(),
    tags: Joi.any(),
    externalDocs: Joi.object({
        description: Joi.string(),
        url: Joi.string().uri(),
    }),       
})


/**
 * finds the host
 *
 * @param  {Object} request
 * @return {String}
 */
function getHost( request ){
    return request.headers['x-forwarded-host'] || request.headers.host;
}


/**
 * finds the schema
 *
 * @param  {Object} request
 * @return {String}
 */
function _getSchema( request ){
    return request.headers['x-forwarded-proto'] || request.server.info.protocol;
}


/**
 * finds the schema
 *
 * @param  {Object} request
 * @return {String}
 */
function getBasePath( settings, options, request ){
    // treat protocol and host as defaults, and override with settings
    var baseUrl = Hoek.applyToDefaults(
        {
            'protocol': settings.schema,
            'host': settings.host
        },
        Url.parse(options.basePath)
    );
    
    return Url.format( baseUrl );    
} 

/**
 * removes none schema properties from options
 *
 * @param  {Object} request
 * @return {String}
 */
function removeNoneSchemaOptions( options ){
    var out =  Hoek.clone( options );
    [
        'documentationPath',
        'jsonPath',
        'swaggerUIPath',
        'pathPrefixSize',
        'payloadType'
    ].forEach(function( element ){
        delete out[element];
    });
    return out;
} 


/**
 * gets the Swagger JSON
 *
 * @param  {Object} settings
 * @return {Object}
 */
builder.getSwaggerJSON = function( settings, request ){
    
    // remove items that cannot be changed by user
    delete settings.swagger
    
    // collect root information
    builder.default.host = getHost( request );
    builder.default.schemes = [_getSchema( request )];
    //builder.default.basePath = getBasePath( builder.default, settings, request );
    
    
    settings = Hoek.applyToDefaults(builder.default, settings);
    var out = removeNoneSchemaOptions( settings );
    Joi.assert(out, builder.schema);
    
    
    out.info = Info.build( settings );
    out.tags = Tags.build( settings );
    var pathData = Paths.build( settings, request );
    
    out.paths =  pathData.paths;
    out.definitions =  pathData.definitions;
    
    //console.log( JSON.stringify( Paths.build( settings, request )) );
    
    return removeNoneSchemaOptions( out );
}