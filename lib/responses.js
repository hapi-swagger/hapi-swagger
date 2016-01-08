'use strict';
const HTTPStatus = require('http-status');
const Hoek = require('hoek');
const Definitions = require('../lib/definitions');
const ShortId = require('shortid');
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
responses.build = function (userDefindedSchemas, defaultSchema, statusSchemas, definitionCollection, altName) {

    let out = {};

    // add defaultSchema to statusSchemas if needed
    if (Utilities.hasProperties(defaultSchema) && (Hoek.reach(statusSchemas, '200') === undefined)) {
        statusSchemas[200] = defaultSchema;
    }

    // loop for each status and convert schema into a definition
    if (Utilities.hasProperties(statusSchemas)){

        for (let key in statusSchemas) {

            let responseName;

            // invert naming if on label is supplied
            if (Hoek.reach(statusSchemas[key], '_settings.language.label')) {
                responseName = Hoek.reach(statusSchemas[key], '_settings.language.label');
            } else {
                responseName = internals.altLabel(altName, key);
                altName = ShortId.generate();
            }

            out[key] = {
                'description': Hoek.reach(statusSchemas[key], '_description'),
                'schema': {
                    '$ref': '#/definitions/' + Definitions.appendJoi(responseName, statusSchemas[key], definitionCollection, 'response_' + altName),
                    'title': internals.altLabel(altName, key)
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
    if (Utilities.hasProperties(userDefindedSchemas)) {
        out = internals.override(out, userDefindedSchemas, definitionCollection, altName);
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
internals.override = function (discoveredSchemas, userDefindedSchemas, definitionCollection, altName) {

    for (let key in userDefindedSchemas) {
        if (userDefindedSchemas.hasOwnProperty(key)) {

            // create a new object by cloning - dont modify user definded objects
            let out = Hoek.clone(userDefindedSchemas[key]);

            // test for any JOI objects
            if (Hoek.reach(userDefindedSchemas[key], 'schema.isJoi') && userDefindedSchemas[key].schema.isJoi === true) {

                const responseName = Hoek.reach(userDefindedSchemas[key].schema, '_settings.language.label');
                // convert JOI objects into Swagger defination references
                out.schema = {
                    '$ref': '#/definitions/' + Definitions.appendJoi(
                        responseName,
                        userDefindedSchemas[key].schema,
                        definitionCollection,
                        internals.altLabel(altName, key)
                        )
                };
            }

            // overwrite discovery with user definded
            discoveredSchemas[key] = Utilities.deleteEmptyProperties(out);
        }
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
