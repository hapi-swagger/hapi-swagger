'use strict';
const HTTPStatus = require('http-status');
const Hoek = require('hoek');
const Schema = require('../lib/schema');
const Definitions = require('../lib/definitions');
const Properties = require('../lib/properties');

const Utilities = require('../lib/utilities');

const internals = {};

exports = module.exports = internals.responses = function (settings, definitionCollection, altDefinitionCollection, definitionCache) {

    this.settings = settings;
    this.definitionCollection = definitionCollection;
    this.altDefinitionCollection = altDefinitionCollection;

    this.definitions = new Definitions(settings);
    this.properties = new Properties(settings, this.definitionCollection, this.altDefinitionCollection, definitionCache);
};


/**
 * build swagger response object
 *
 * @param  {Object} userDefindedSchemas
 * @param  {Object} defaultSchema
 * @param  {Object} statusSchemas
 * @param  {Boolean} useDefinitions
 * @param  {Boolean} isAlt
 * @return {Object}
 */
internals.responses.prototype.build = function (userDefindedSchemas, defaultSchema, statusSchemas, useDefinitions, isAlt) {

    let out = {};


    // add defaultSchema to statusSchemas if needed
    if (Utilities.hasProperties(defaultSchema) && (Hoek.reach(statusSchemas, '200') === undefined)) {
        statusSchemas[200] = defaultSchema;
    }

    // loop for each status and convert schema into a definition
    if (Utilities.hasProperties(statusSchemas)) {
        for (let key in statusSchemas) {
            // name, joiObj, parameterType, useDefinitions, isAlt
            let response = this.getResponse(key, statusSchemas[key], null, useDefinitions, isAlt);
            /* TODO removed for coverage issues - needs review
            // deals with response starting with an array
            if (response.schema.items && response.schema.items.$ref) {
                response.schema = {
                    '$ref': response.schema.items.$ref
                };
            }
            */
            out[key] = response;
        }
    }

    // use plug-in options overrides to enchance hapi objects and properties
    if (Utilities.hasProperties(userDefindedSchemas) === true) {
        out = this.optionOverride(out, userDefindedSchemas, useDefinitions, isAlt);
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
 * @param  {Boolean} useDefinitions
 * @param  {Boolean} isAlt
 * @return {Object}
 */
internals.responses.prototype.optionOverride = function (discoveredSchemas, userDefindedSchemas, useDefinitions, isAlt) {

    for (let key in userDefindedSchemas) {

        // create a new object by cloning - dont modify user definded objects
        let out = Hoek.clone(userDefindedSchemas[key]);

        // test for any JOI objects
        if (Hoek.reach(userDefindedSchemas[key], 'schema.isJoi') && userDefindedSchemas[key].schema.isJoi === true) {
            out = this.getResponse(key, userDefindedSchemas[key].schema, useDefinitions, isAlt);
            out.description = userDefindedSchemas[key].description;
        }


        // overwrite discovery with user definded
        if (!discoveredSchemas[key] && out) {
            // if it does not exist create it
            discoveredSchemas[key] = out;
        } else {
            // add description to schema
            if (out.description) {
                discoveredSchemas[key].description = out.description;
            }
            // overwrite schema
            if (out.schema) {
                discoveredSchemas[key].schema = out.schema;
            }
        }
        discoveredSchemas[key] = Utilities.deleteEmptyProperties(discoveredSchemas[key]);

    }
    return discoveredSchemas;
};



/**
 * takes a joi object and creates a response object for a given http status code
 *
 * @param  {String} statusCode
 * @param  {Object} joiObj
 * @param  {Boolean} useDefinitions
 * @param  {Boolean} isAlt
 * @return {Object}
 */
internals.responses.prototype.getResponse = function (statusCode, joiObj, useDefinitions, isAlt) {

    let out;
    let outProperties = this.properties.parseProperty(null, joiObj, this.getDefinitionCollection(isAlt), useDefinitions, false);
    let outSchema = Schema.build(outProperties, joiObj._type);

    out = {
        'description': Hoek.reach(joiObj, '_description'),
        'schema': outSchema
    };

     /* TODO removed for coverage issues - needs review
    let definitionName = Utilities.geJoiLabel(joiObj);
    if (out.schema.properties || out.schema.items && !out.schema.items.$ref) {
        let refName = this.definitions.append(definitionName, out.schema, this.getDefinitionCollection(isAlt), this.settings);
        out.schema = {
            '$ref': this.getDefinitionRef(isAlt) + refName
        };
    }
    */

    out.headers = Utilities.getJoiMetaProperty(joiObj, 'headers');
    out.examples = Utilities.getJoiMetaProperty(joiObj, 'examples');
    delete out.schema['x-meta'];
    out = Utilities.deleteEmptyProperties(out);

    // default description if not given
    if (!out.description) {
        out.description = HTTPStatus[statusCode].replace('OK', 'Successful');
    }

    return out;

};


/**
 * selects the correct definition collection
 *
 * @param  {Boolean} isAlt
 * @return {Object}
 */
internals.responses.prototype.getDefinitionCollection = function (isAlt) {

    return (isAlt === true) ? this.altDefinitionCollection : this.definitionCollection;
};


/**
 * selects the correct definition reference
 *
 * @param  {Boolean} isAlt
 * @return {String}
 */
/* TODO removed for coverage issues - needs review
internals.responses.prototype.getDefinitionRef = function (isAlt) {

    return (isAlt === true) ? '#/x-alt-definitions/' : '#/definitions/';
};
*/
