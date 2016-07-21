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
 * @param  {Object} userDefindedSchemas
 * @param  {Object} defaultSchema
 * @param  {Object} statusSchemas
 * @param  {Object} definitionCollection
 * @return {Object}
 */
responses.build = function (userDefindedSchemas, defaultSchema, statusSchemas, definitionCollection, altDefinitionCollection, altName) {

    let out = {};

    // add defaultSchema to statusSchemas if needed
    if (Utilities.hasProperties(defaultSchema) && (Hoek.reach(statusSchemas, '200') === undefined)) {
        statusSchemas[200] = defaultSchema;
    }

    // loop for each status and convert schema into a definition
    if (Utilities.hasProperties(statusSchemas)){

        for (let key in statusSchemas) {

            let responseName = Utilities.geJoiLabel( statusSchemas[key] );

            // invert naming if on label is supplied
            if ( Utilities.geJoiLabel( statusSchemas[key]) ) {
                responseName = Utilities.geJoiLabel( statusSchemas[key]);
            }

            out[key] = {
                'description': Hoek.reach(statusSchemas[key], '_description'),
                'schema': {
                    '$ref': '#/definitions/' + Definitions.appendJoi(responseName, statusSchemas[key], definitionCollection, altDefinitionCollection, null, false),
                    'title': key
                }
            };

            out[key].schema.title = responseName;
            out[key].headers = Utilities.getJoiMetaProperty(statusSchemas[key], 'headers');
            out[key].example = Utilities.getJoiMetaProperty(statusSchemas[key], 'example');

            out[key] = Utilities.deleteEmptyProperties(out[key]);
            // make sure we always have a description as its required for swagger response object
            if (!out[key].description) {
                out[key].description = HTTPStatus[key].replace('OK', 'Successful');
            }

        }
    }

    // use plug-in overrides to enchance hapi objects and properties
    if (Utilities.hasProperties(userDefindedSchemas) === true) {
        out = internals.override(out, userDefindedSchemas, definitionCollection, altDefinitionCollection, altName);
    }

    // make sure 200 status always has a schema #237
    if (out[200] && out[200].schema === undefined) {
        out[200].schema = {
            'type': 'string'
        };
    }

    // make sure there is a default if no other responses are found
    if (Utilities.hasProperties(out) === false) {
        out.default = {
            'schema': {
                'type': 'string'
            },
            'description': 'Successful'
        };
    }

    return Utilities.deleteEmptyProperties(out);
};


/**
 * replaces discovered response objects with user defined objects
 *
 * @param  {Object} discoveredSchemas
 * @param  {Object} userDefindedSchemas
 * @param  {Object} definitionCollection
 * @param  {String} altName
 * @return {Object}
 */
internals.override = function (discoveredSchemas, userDefindedSchemas, definitionCollection, altDefinitionCollection, altName) {

    for (let key in userDefindedSchemas) {

        // create a new object by cloning - dont modify user definded objects
        let out = Hoek.clone(userDefindedSchemas[key]);

        // test for any JOI objects
        if (Hoek.reach(userDefindedSchemas[key], 'schema.isJoi') && userDefindedSchemas[key].schema.isJoi === true) {

            const responseName = Utilities.geJoiLabel( userDefindedSchemas[key].schema );

            // convert JOI objects into Swagger defination references
            out.schema = {
                '$ref': '#/definitions/' + Definitions.appendJoi(
                    responseName,
                    userDefindedSchemas[key].schema,
                    definitionCollection,
                    altDefinitionCollection,
                    internals.altLabel(altName, key),
                    false
                    )
            };
        }

        // overwrite discovery with user definded
        discoveredSchemas[key] = Utilities.deleteEmptyProperties(out);

    }
    return discoveredSchemas;
};


/**
 * create alt label for response object
 *
 * @param  {String} altName
 * @param  {String} key
 * @return {String}
 */
internals.altLabel = function (altName, key) {

    return 'response_' + altName + '_' + key;
};
