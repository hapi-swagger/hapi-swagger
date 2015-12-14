'use strict';
var Hoek = require('hoek');

var Properties = require('../lib/properties'),
    Utilities = require('../lib/utilities');

var definitions = module.exports = {},
    internals = {};


/**
 * append a new definition object from a joi object
 *
 * @param  {string} definitionName
 * @param  {Object} joiObj
 * @param  {Object} definitionCollection
 * @param  {string} altName
 * @return {Object}
 */
definitions.appendJoi = function (definitionName, joiObj, definitionCollection, altName) {

    var newDefinition;
    if (Array.isArray(joiObj)){
        var propertyObj = Properties.parseProperties(joiObj, definitionCollection);
        var propertyArray = Properties.swaggerObjectToArray(propertyObj, null);
        newDefinition = internals.wrap(propertyArray);
    } else {
        newDefinition = Properties.parseProperty(definitionName, joiObj, definitionCollection);
    }
    return definitions.append(definitionName, newDefinition, definitionCollection, altName);
};


/**
 * append a new definition object
 *
 * @param  {string} definitionName
 * @param  {Object} definition
 * @param  {Object} definitionCollection
 * @param  {string} altName
 * @return {Object}
 */
definitions.append = function (definitionName, definition, definitionCollection, altName) {

    var formatted = internals.createProperties( definition.properties );
    definition.properties = formatted.properties;
    if (formatted.required){
        definition.required = formatted.required;
    }

    return internals.appendFormatted(definitionName, definition, definitionCollection, altName);
};


/**
 * append a new formatted definition object
 *
 * @param  {string} definitionName
 * @param  {Object} definition
 * @param  {Object} definitionCollection
 * @param  {string} altName
 * @return {Object}
 */
internals.appendFormatted = function (definitionName, definition, definitionCollection, altName) {

    var out = null;

    // remove unneeded properties
    delete definition.name;

    // find existing definition by this definitionName
    var foundDefinition = definitionCollection[definitionName];
    if (foundDefinition) {
        // deep compare objects
        if (Hoek.deepEqual(foundDefinition, definition)) {
            // return existing definitionName if existing object is exactly the same
            out = definitionName;
        } else {
            // create new definition with altName
            // to stop reuse of definition with same name but different structures
            definitionCollection[altName] = definition;
            out = altName;
        }
    } else {
        // create new definition
        definitionCollection[definitionName || altName] = definition;
        out = definitionName || altName;
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
