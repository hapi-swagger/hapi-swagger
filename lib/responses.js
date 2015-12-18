'use strict';
const HTTPStatus = require('http-status');
const Hoek = require('hoek');
const Definitions = require('../lib/definitions');
const Utilities = require('../lib/utilities');

const internals = {};
const responses = module.exports = {};


/**
 * build swagger response object
 *
 * @param  {Object} userDefindedObjs
 * @param  {Object} defaultSchema
 * @param  {Object} statusSchemas
 * @param  {Object} definitionCollection
 * @return {Object}
 */
responses.build = function (userDefindedObjs, defaultSchema, statusSchemas, definitionCollection, operationId) {

    let out = {};

    // add defaultSchema to statusSchemas if needed
    if (defaultSchema && (Hoek.reach(statusSchemas, '200') === undefined)) {
        statusSchemas[200] = defaultSchema;
    }

    // loop for each status and convert schema into a definition
    if (statusSchemas) {
        for (let key in statusSchemas) {
            if (statusSchemas.hasOwnProperty(key)) {

                const responseName = Hoek.reach(statusSchemas[key], '_settings.language.label');
                out[key] = {
                    description: Hoek.reach(statusSchemas[key], '_description')
                };
                out[key].headers = Utilities.getJoiMetaProperty(statusSchemas[key], 'headers');
                out[key].example = Utilities.getJoiMetaProperty(statusSchemas[key], 'example');

                // only add schema if object has children
                if (Utilities.hasJoiChildren(statusSchemas[key])) {
                    out[key] = {
                        schema: {
                            '$ref': '#/definitions/' + Definitions.appendJoi(responseName, statusSchemas[key], definitionCollection, operationId + '_' + key)
                        }
                    };
                }
                out[key] = Utilities.deleteEmptyProperties(out[key]);
                // make sure we always have a description as its required for swagger response object
                if (!out[key].description){
                    out[key].description = HTTPStatus[key].replace('OK','Successful');
                }
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
        out = internals.override(out, userDefindedObjs, definitionCollection, operationId);
       // out =  internals.override({}, userDefindedObjs, definitionCollection);
    }
    return Utilities.deleteEmptyProperties(out);
};


/**
 * replaces discovered objects with user defined objects
 *
 * @param  {Object} discoveredObjs
 * @param  {Object} userDefindedObjs
 * @param  {Object} definitionCollection
 * @return {Object}
 */
internals.override = function (discoveredObjs, userDefindedObjs, definitionCollection, operationId) {

    for (let key in userDefindedObjs) {
        if (userDefindedObjs.hasOwnProperty(key)) {

            // create a new object by cloning - dont modify user definded objects
            let out = Hoek.clone(userDefindedObjs[key]);

            // test for any JOI objects
            if (Hoek.reach(userDefindedObjs[key], 'schema.isJoi') && userDefindedObjs[key].schema.isJoi === true) {
                //var responseName = Utilities.getJoiMetaProperty(userDefindedObjs[key].schema, 'name');
                const responseName = Hoek.reach(userDefindedObjs[key].schema, '_settings.language.label');

                // convert JOI objects into Swagger defination references
                out.schema = {
                    '$ref': '#/definitions/' + Definitions.appendJoi(responseName, userDefindedObjs[key].schema, definitionCollection, operationId + '_' + key)
                };
            }

            // overwrite discovery with user definded
            discoveredObjs[key] = out;
        }
    }
    return discoveredObjs;
};

