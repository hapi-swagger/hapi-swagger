'use strict';
const Hoek = require('hoek');
const Hash = require('../lib/hash');
const Properties = require('../lib/properties');
const Utilities = require('../lib/utilities');


const internals = {};

exports = module.exports = internals.definitions = function (settings) {

    this.settings = settings;
    this.properties = new Properties(settings);
    this.defCache = new WeakMap();
};


/**
 * append a new definition object from a joi object
 *
 * @param  {string} definitionName
 * @param  {Object || Array} joiObj
 * @param  {Object} definitionCollection
 * @param  {string} altName
 * @param  {boolean} isAlt
 * @return {Object}
 */
internals.definitions.prototype.appendJoi = function (definitionName, joiObj, definitionCollection, altDefinitionCollection, altName, isAlt) {

    let currentCollection = (isAlt) ? altDefinitionCollection : definitionCollection;
    if (!this.defCache.has(currentCollection)) {
        this.defCache.set(currentCollection, new WeakMap());
    }
    const joiCache = this.defCache.get(currentCollection);

    // covert JOI object into internal object
    let newDefinition;
    if (joiCache.has(joiObj)) {
        newDefinition = joiCache.get(joiObj);
    } else if (Array.isArray(joiObj)) {
        let parameterArray = this.properties.toParameters(joiObj, definitionCollection, altDefinitionCollection, null, isAlt);
        newDefinition = internals.wrapParameters(parameterArray);
        joiCache.set(joiObj, newDefinition);
    } else {
        newDefinition = this.properties.parseProperty(definitionName || altName, joiObj, definitionCollection, altDefinitionCollection, isAlt);
        joiCache.set(joiObj, newDefinition);
    }

    if (newDefinition.schema) {
        return newDefinition.name;
    }
    return internals.appendFormatted(definitionName, newDefinition, currentCollection, this.settings);
};


/**
 * append a new formatted definition object
 *
 * @param  {string} definitionName
 * @param  {Object} definition
 * @param  {Object} currentCollection
 * @param  {Object} settings
 * @return {Object}
 */
internals.appendFormatted = function (definitionName, definition, currentCollection, settings) {

    let out = null;

    definition = internals.formatProperty(definition);

    // reomve required if its not an array
    if (definition.required && !Array.isArray(definition.required)) {
        delete definition.required;
    }

    // remove unneeded properties
    delete definition.name;

    // find existing definition by this definitionName
    let foundDefinition = currentCollection[definitionName];
    if (foundDefinition) {
        // deep compare objects
        if (Hoek.deepEqual(foundDefinition, definition)) {
            // return existing definitionName if existing object is exactly the same
            out = definitionName;
        } else {
            // create new definition
            out = internals.append(null, definition, currentCollection, settings);
        }
    } else {
        // create new definition
        out = internals.append(definitionName, definition, currentCollection, settings);
    }

    return out;
};



internals.append = function (definitionName, definition, currentCollection, settings){

    let out;
    let foundDefinitionName;
    // find definitionName by matching hash of object
    if (settings.reuseModels) {
        foundDefinitionName = internals.hasDefinition(definition, currentCollection);
    }
    if (foundDefinitionName) {
        out = foundDefinitionName;
    } else {
        // else create a new item using definitionName or next model number
        out = definitionName || internals.nextModelName(currentCollection);
        currentCollection[out] = definition;
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
        delete obj.required;

        out.properties[obj.name] = obj;
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
    return Hash(str);
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

        if (hash === internals.hash(obj)) {
            return key;
        }
    }
    return null;
};
