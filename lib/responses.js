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
    if (defaultSchema && (!statusSchemas || !statusSchemas[200])) {
        statusSchemas[200] = defaultSchema;
    }

    if (statusSchemas) {
        // loop for each status and convert schema into a definition
        for (var key in statusSchemas) {
            if (statusSchemas.hasOwnProperty(key)) {
                var responseClassName = internals.getJOIClassName(statusSchemas[key]);
                out[key] = {
                    description: Hoek.reach(statusSchemas[key], '_description')
                };
                out[key].headers = internals.getMetaProperty(statusSchemas[key], 'headers');
                out[key].example = internals.getMetaProperty(statusSchemas[key], 'example');

                // only add schema if object has children
                if (internals.hasJoiObjectChildren(statusSchemas[key])) {
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
        // add default Successfulif we still have no responses
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
 * does JOI object have children
 *
 * @param  {Object} joiObj
 * @return {Boolean}
 */
internals.hasJoiObjectChildren = function (joiObj) {

    return (joiObj._inner.children === null) ? false : true;
};


/**
 * get meta property value from JOI object
 *
 * @param  {Object} joiObj
 * @param  {String} propertyName
 * @return {Object || Null}
 */
internals.getMetaProperty = function (joiObj, propertyName) {

    // get headers added using meta function
    if (Hoek.reach(joiObj, '_meta')
        && Array.isArray(joiObj._meta)) {

        var i,
            meta = joiObj._meta;

        i = meta.length;
        while (i--) {
            if (meta[i][propertyName]) {
                return meta[i][propertyName];
            }
        }
    }
    return null;
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
                var responseClassName = internals.getJOIClassName(userDefindedObjs[key].schema);

                // convert JOI objects into Swagger defination references
                userDefindedObjs[key].schema = {
                    '$ref': '#/definitions/' + Definitions.appendDefinition(responseClassName, userDefindedObjs[key].schema, definitions)
                };
            }
        }
        discoveredObjs[key] = userDefindedObjs[key];
    }
    return discoveredObjs;
};


/**
 * given a JOI schema get its className
 *
 * @param  {Object} joiObj
 * @return {String || undefined}
 */
internals.getJOIClassName = function (joiObj) {

    if (joiObj && joiObj._meta && Array.isArray(joiObj._meta)) {
        var i = joiObj._meta.length;
        while (i--) {
            if (joiObj._meta[i].className) {
                return joiObj._meta[i].className;
            }
        }
    }
    return undefined;
};
