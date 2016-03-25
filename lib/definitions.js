'use strict';
const Hoek = require('hoek');
const Farmhash = require('farmhash');
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
 * @param  {boolean} isAlt
 * @return {Object}
 */
definitions.appendJoi = function (definitionName, joiObj, definitionCollection, altDefinitionCollection, altName, isAlt) {

    let currentCollection = (isAlt) ? altDefinitionCollection : definitionCollection;

    // covert JOI object into internal object
    let newDefinition;
    if (Array.isArray(joiObj)) {
        let parameterArray = Properties.toParameters(joiObj, definitionCollection, altDefinitionCollection, null, isAlt);
        newDefinition = internals.wrapParameters(parameterArray);
    } else {
        newDefinition = Properties.parseProperty(definitionName || altName, joiObj, definitionCollection, altDefinitionCollection, isAlt);
    }

    // format structure into new definition object
    const formatted = internals.formatProperties(newDefinition.properties);
    if (formatted.properties) {
        newDefinition.properties = formatted.properties;
    }

    return internals.appendFormatted(definitionName, newDefinition, currentCollection, altName);
};


/**
 * append a new formatted definition object
 *
 * @param  {string} definitionName
 * @param  {Object} definition
 * @param  {Object} currentCollection
 * @param  {string} altName
 * @return {Object}
 */
internals.appendFormatted = function (definitionName, definition, currentCollection, altName) {

    let out = null;


    // remove unneeded properties
    delete definition.name;

    //definitionName =  definitionName + Math.random() * (99999 - 0) + 0;

    // find existing definition by this definitionName
    let foundDefinition = currentCollection[definitionName];
    if (foundDefinition) {
        // deep compare objects
        if (Hoek.deepEqual(foundDefinition, definition)) {
            // return existing definitionName if existing object is exactly the same
            out = definitionName;
        } else {
            // create new definition with altName
            // to stop reuse of definition with same name but different structures
            // if (!altName) {
            //altName = ShortId.generate();
            //altName = internals.hash(definition);
            // }
            let foundDefinitionName = internals.hasDefinition(internals.formatProperty(definition), currentCollection);
            if (foundDefinitionName) {
                out = foundDefinitionName;
            } else {
                altName = internals.nextModelName(currentCollection);
                currentCollection[altName] = internals.formatProperty(definition);
                out = altName;
            }
        }
    } else {
        // create new definition
        //definition.name = (definitionName || altName) + 'x';
        currentCollection[definitionName || altName] = definition;
        out = definitionName || altName;
    }

    return out;
};


/**
 * builds definition object properties structure from parameters
 *
 * @param  {Object} parameters
 * @return {Object}
 */
internals.formatProperties = function (parameters) {

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
            out.required.push(obj.name);
        }

        out.properties[obj.name || key] = obj;
        obj = internals.formatProperty(obj);
    }
    return Utilities.deleteEmptyProperties(out);
};


/**
 * formats a parameter for use in a definition object
 *
 * @param  {Object} parameter
 * @return {Object}
 */
internals.formatProperty = function (obj) {

    // add $ref directly to parent and delete schema
    if (obj.schema) {
        obj.$ref = obj.schema.$ref;
        delete obj.schema;
    }

    // remove emtpy properties
    obj = Utilities.deleteEmptyProperties(obj);

    // remove unneeded properties
    delete obj.name;
    delete obj.required;

    return obj;
};


/**
 * wraps definition object in the JSON schema structure
 *
 * @param  {Object} parameters
 * @return {Object}
 */
internals.wrapParameters = function (parameters) {

    let out = {
        'type': 'object',
        'properties': {}
    };
    let props = internals.formatProperties(parameters);

    // merge in properties and required structures
    out = Hoek.merge(props, out);
    return out;
};


internals.hash = function (obj) {

    const str = JSON.stringify(obj);
    return Farmhash.hash32(str);
};


internals.nextModelName = function (currentCollection) {

    let highest = 0;
    let key;
    for (key in currentCollection) {
        if (Utilities.startsWith(key, 'Model')) {
            let num = parseInt(key.replace('Model', ''), 10);
            if (num && num > highest) {
                highest = num;
            }
        }
    }
    return 'Model ' + (highest + 1);
};


internals.hasDefinition = function (definition, currentCollection) {

    let key;
    let hash = internals.hash(definition);

    for (key in currentCollection) {
        let obj = currentCollection[key];
        //console.log(hash === internals.hash( obj ));

        if (hash === internals.hash(obj)) {
            return key;
        }
    }
    return null;
};
