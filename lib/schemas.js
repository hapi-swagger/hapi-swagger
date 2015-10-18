
var Joi 	= require('joi');


var schemas = module.exports = {};


// schema for options passed to hapi-swagger plugin
schemas.plugin = Joi.object({
    auth: Joi.boolean(),
    basePath: Joi.string(),
    protocol: Joi.string(), 
    documentationPath: Joi.string(),
    jsonPath: Joi.string(),
    swaggeruiPath: Joi.string(),
});

// schema for options passed by route configure for hapi-swagger plugin
schemas.pluginRoutes = Joi.object({
    nickname: Joi.string(),
    payloadType: Joi.string(), 
    validate: Joi.string(),
    responseMessages: Joi.string()
});


// schema info section swagger JSON
schemas.info = Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    termsOfService: Joi.string(),
    contact: Joi.object({
        name: Joi.string(),
        url: Joi.string().uri(),
        email: Joi.string().email(),
    }),
    license: Joi.object({
        name: Joi.string(),
        url: Joi.string().uri(),
    }),
    version: Joi.string()
});