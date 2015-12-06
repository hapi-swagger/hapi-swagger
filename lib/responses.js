'use strict';
var Hoek = require('hoek');

var Definitions = require('../lib/definitions'),
    Utilities = require('../lib/utilities');

var internals = {},
    responses = module.exports = {};


/**
 * build swagger response object
 *
 * @param  {Object} userDefindedObjs
 * @param  {Object} defaultSchema
 * @param  {Object} statusSchemas
 * @param  {Object} definitions
 * @return {Object}
 */
responses.build = function (userDefindedObjs, defaultSchema, statusSchemas, definitions) {

    var out = {};

    // add defaultSchema to statusSchemas if needed
    if (defaultSchema && (Hoek.reach(statusSchemas, '200') === undefined)) {
        statusSchemas[200] = defaultSchema;
    }

    if (statusSchemas) {
        // loop for each status and convert schema into a definition
        for (var key in statusSchemas) {
            if (statusSchemas.hasOwnProperty(key)) {
                var responseClassName = Utilities.getJoiMetaProperty(statusSchemas[key], 'className');
                out[key] = {
                    description: Hoek.reach(statusSchemas[key], '_description')
                };
                out[key].headers = Utilities.getJoiMetaProperty(statusSchemas[key], 'headers');
                out[key].example = Utilities.getJoiMetaProperty(statusSchemas[key], 'example');

                // only add schema if object has children
                if (Utilities.hasJoiChildren(statusSchemas[key])) {
                    out[key] = {
                        schema: {
                            '$ref': '#/definitions/' + Definitions.appendDefinition(responseClassName, statusSchemas[key], definitions)
                        }
                    };
                }
                out[key] = Utilities.deleteEmptyProperties(out[key]);
            }
        }
    } else {
        // add default Successful if we still have no responses
        out[200] = {
            'schema': {
                'type': 'string'
            },
            'description': 'Successful'
        };
    }

    // use plug-in overrides to enchance hapi objects and properties
    if (Utilities.hasProperties(userDefindedObjs)) {
        out = internals.override(out, userDefindedObjs, definitions);
    }
    return Utilities.deleteEmptyProperties(out);
};


/**
 * replaces discovered objects with user defined objects
 *
 * @param  {Object} discoveredObjs
 * @param  {Object} userDefindedObjs
 * @param  {Object} definitions
 * @return {Object}
 */
internals.override = function (discoveredObjs, userDefindedObjs, definitions) {

    for (var key in userDefindedObjs) {
        if (userDefindedObjs.hasOwnProperty(key)) {
            if (Hoek.reach(userDefindedObjs[key], 'schema.isJoi') && userDefindedObjs[key].schema.isJoi === true) {
                var responseClassName = Utilities.getJoiMetaProperty(userDefindedObjs[key].schema, 'className');

                // convert JOI objects into Swagger defination references
                userDefindedObjs[key].schema = {
                    '$ref': '#/definitions/' + Definitions.appendDefinition(responseClassName, userDefindedObjs[key].schema, definitions)
                };
            }
            discoveredObjs[key] = userDefindedObjs[key];
        }
    }
    return discoveredObjs;
};

