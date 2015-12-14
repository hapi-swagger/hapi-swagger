'use strict';
var Hoek = require('hoek');

var Properties = require('../lib/properties'),
    Utilities = require('../lib/utilities');

var definitions = module.exports = {},
    internals = {};


/**
 * append a new definition object from a joi object
 *
 * @param  {Object} joiObj
 * @param  {Object} definitionCollection
 * @return {Object}
 */
definitions.appendJoi = function (name, joiObj, definitionCollection, altName) {

    var newDefinition;
    if (Array.isArray(joiObj)){
        var propertyObj = Properties.parseProperties(joiObj, definitionCollection);
        var propertyArray = Properties.swaggerObjectToArray(propertyObj, null);
        newDefinition = internals.wrap(propertyArray);
    } else {
        newDefinition = Properties.parseProperty(name, joiObj, definitionCollection);
    }
    return definitions.append(name, newDefinition, definitionCollection, altName);
};


/**
 * append a new definition object - external
 *
 * @param  {Object} joiObj
 * @param  {Object} definitionCollection
 * @return {Object}
 */
definitions.append = function (name, definition, definitionCollection, altName) {

    var formatted = internals.createProperties( definition.properties );
    definition.properties = formatted.properties;
    if (formatted.required){
        definition.required = formatted.required;
    }

    return internals.appendFormatted(name, definition, definitionCollection, altName);
};


/**
 * append a formatted definition object
 *
 * @param  {Object} joiObj
 * @param  {Object} definitionCollection
 * @return {Object}
 */
internals.appendFormatted = function (name, definition, definitionCollection, altName) {

    var out = null;

    // remove unneeded properties
    delete definition.name;

    // find existing definition by this name
    var foundDefinition = definitionCollection[name];
    if (foundDefinition) {
        // deep compare objects
        if (Hoek.deepEqual(foundDefinition, definition)) {
            // return existing name if existing object is exactly the same
            out = name;
        } else {
            // create new definition with altName
            // to stop reuse of definition with same name but different structures
            definitionCollection[altName] = definition;
            out = altName;
        }
    } else {
        // create new definition
        definitionCollection[name || altName] = definition;
        out = name || altName;
    }

    return out;
};


/**
 * builds definition object properties structure (input is swagger parameter model)
 *
 * @param  {Object} parameters
 * @return {Object}
 */
internals.createProperties = function (parameters) {

    var out = {
        properties: {}
    };


    for (var key in parameters) {
        var obj = parameters[key];

        // move required to top level
        if (obj.required) {
            if (out.required === undefined) {
                out.required = [];
            }
            out.required.push(obj.name || key);
        }

        // remove emtpy properties
        obj = Utilities.deleteEmptyProperties(obj);

        // recurse into child objects
        if (obj.type === 'object' && obj.properties) {
            out.properties[obj.name] = internals.createProperties(obj.properties);
        } else {
            // if child has no name use its key
            out.properties[obj.name || key] = obj;
        }

        // remove unneeded properties
        delete obj.name;
        delete obj.required;
    }
    return out;
};


/**
 * wraps definition object in the JSON schema structure
 *
 * @param  {Object} parameters
 * @return {Object}
 */
internals.wrap = function (parameters) {

    var out = {
            'type': 'object',
            'properties': {}
        },
        props = internals.createProperties(parameters);

    // merge in properties and required structures
    out = Hoek.merge(props, out);
    return out;
};
