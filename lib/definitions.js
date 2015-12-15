'use strict';
const Hoek = require('hoek');
const Properties = require('../lib/properties');
const Utilities = require('../lib/utilities');

const definitions = module.exports = {};
const internals = {};


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

    let newDefinition;
    if (Array.isArray(joiObj)){
        let propertyObj = Properties.parseProperties(joiObj, definitionCollection);
        let propertyArray = Properties.swaggerObjectToArray(propertyObj, null);
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

    const formatted = internals.createProperties( definition.properties );
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

    let out = null;

    // remove unneeded properties
    delete definition.name;

    // find existing definition by this definitionName
    const foundDefinition = definitionCollection[definitionName];
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

    let out = {
        properties: {}
    };


    for (let key in parameters) {
        let obj = parameters[key];

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

    let out = {
            'type': 'object',
            'properties': {}
        },
        props = internals.createProperties(parameters);

    // merge in properties and required structures
    out = Hoek.merge(props, out);
    return out;
};
