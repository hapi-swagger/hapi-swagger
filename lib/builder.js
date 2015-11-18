/*
 * Builds the swagger JSON file
 */

'use strict';
var Hoek             = require('hoek'),
    Boom             = require('boom'),
    Joi              = require('joi'),
    Path             = require('path'),
    Url              = require('url'),
    Group            = require('../lib/group'),
    Filter           = require('../lib/filter'),
    Definitions      = require('../lib/definitions'),
    Info             = require('../lib/info'),
    Paths            = require('../lib/paths'),
    Tags             = require('../lib/tags');


var builder = module.exports = {};


// default data for root object
builder.default = {
    'swagger': '2.0',
    'schemes': ['http'],
    'host': 'localhost',
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
        'payloadType',
        'enableDocumentationPage',
        'expanded',
        'lang'
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
    
    
    settings = Hoek.applyToDefaults(builder.default, settings);
    var out = removeNoneSchemaOptions( settings );
    Joi.assert(out, builder.schema);
    
    
    out.info = Info.build( settings );
    out.tags = Tags.build( settings );
    
    
    var routes = request.connection.table();
    
    // filter routes displayed based on tags passed in query string
    if (request.query.tags) {
        var filterTags = request.query.tags.split(',');
        routes = Filter.byTags( filterTags, routes );
    }
    
    // group the routes - by path
    Group.byPath( settings, routes );
    
    
    
    var pathData = Paths.build( settings, routes );
    
    out.paths =  pathData.paths;
    out.definitions =  pathData.definitions;
    
    //console.log( JSON.stringify( Paths.build( settings, request )) );
    
    return removeNoneSchemaOptions( out );
}