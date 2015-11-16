/*
 * Builds the swagger JSON file tag section
 */


'use strict';
var Joi     = require('joi'),
    Hoek    = require('hoek');

var tags = module.exports = {};	


// schema for tags
tags.schema = Joi.array().items(
    Joi.object({
        name: Joi.string().required(),
        description: Joi.string(),
        externalDocs: Joi.object({
            description: Joi.string(),
            url: Joi.string().uri(),
        }),
    }).meta({
        className: 'Tag'
    })
).optional();  


/**
 * build the swagger tag section
 *
 * @param  {Object} settings
 * @return {Object}
 */	
tags.build = function( settings ){
    if( settings.tags ){
        Joi.assert(settings.tags, tags.schema);
        return settings.tags;
    }else{
        return [];
    }
}

