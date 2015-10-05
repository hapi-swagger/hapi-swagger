
var Joi 	= require('joi');


var schemas = module.exports = {};



// schema for options passed to hapi-swagger
schemas.options = Joi.object({
    auth: Joi.boolean(),
    basePath: Joi.string(),
    protocol: Joi.string(), 
    documentationPath: Joi.string(),
    jsonPath: Joi.string(),
    swaggeruiPath: Joi.string(),
});


// schema swagger version
schemas.swagger = Joi.string().valid('2.0').required();

// schema info section swagger JSON
schemas.info = Joi.object({
    title: Joi.string().required(),
    version: Joi.string(),
    description: Joi.string(),
    termsOfService: Joi.string(),
    contact: Joi.object({
    		name: Joi.string(),
    		url: Joi.string(),
    		email: Joi.string(),
    	}),
    license: Joi.object({
    		name: Joi.string(),
    		url: Joi.string(),
    	}),
});