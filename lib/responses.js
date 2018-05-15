const HTTPStatus = require('http-status');
const Hoek = require('hoek');
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

            if (userDefindedSchemas[key].headers) {
                out.headers = userDefindedSchemas[key].headers;
            }

        } else if (!out.description) {
            out.description = HTTPStatus[key].replace('OK', 'Successful');
        }


        // overwrite discovery with user definded
        if (!discoveredSchemas[key] && out) {
            // if it does not exist create it
            discoveredSchemas[key] = out;
        }
        else {
            // override all user defined values

            for (let item in out) {

                const value = out[item];

                if (value !== undefined) {
                    discoveredSchemas[key][item] = value;
                }
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
internals.responses.prototype.getResponse = function (statusCode, joiObj, useDefinitions) {

    let out;
    //name, joiObj, parent, parameterType, useDefinitions, isAlt
    let outProperties = this.properties.parseProperty(null, joiObj, null, 'body', useDefinitions, false);
    out = {
        'description': Hoek.reach(joiObj, '_description'),
        'schema': outProperties
    };

    out.headers = Utilities.getJoiMetaProperty(joiObj, 'headers');
    out.examples = Utilities.getJoiMetaProperty(joiObj, 'examples');
    delete out.schema['x-meta'];
    out = Utilities.deleteEmptyProperties(out);

    // default description if not given
    if (!out.description && HTTPStatus[statusCode]) {
        out.description = HTTPStatus[statusCode].replace('OK', 'Successful');
    }

    return out;
};
