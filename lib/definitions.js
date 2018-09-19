const Hoek = require('hoek');
const Hash = require('../lib/hash');
const Utilities = require('../lib/utilities');


const internals = {};

exports = module.exports = internals.definitions = function (settings) {

    this.settings = settings;
};


/**
 * appends a new definition object to a given collection, returns a string reference name
 *
 * @param  {string} definitionName
 * @param  {Object} definition
 * @param  {Object} currentCollection
 * @param  {Object} settings
 * @return {String}
 */
internals.definitions.prototype.append = function (definitionName, definition, currentCollection, settings) {

    let out = null;

    definition = internals.formatProperty(definition);

    // remove required if its not an array
    //if (definition.required && !Array.isArray(definition.required)) {
    //    delete definition.required;
    //}

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
            out = internals.append(definitionName, definition, currentCollection, true, settings);
        }
    } else {
        // create new definition
        out = internals.append(definitionName, definition, currentCollection, false, settings);
    }

    return out;
};


/**
 * Internal - appends a new definition object to a given collection, returns a string reference name
 *
 * @param  {string} definitionName
 * @param  {Object} definition
 * @param  {Object} currentCollection
 * @param  {Object} settings
 * @return {String}
 */
internals.append = function (definitionName, definition, currentCollection, forceDynamicName, settings) {

    let out;
    let foundDefinitionName;

    delete definition.optional;

    // find definitionName by matching hash of object
    if (settings.reuseDefinitions) {
        foundDefinitionName = internals.hasDefinition(definition, currentCollection);
    }
    if (foundDefinitionName) {
        out = foundDefinitionName;
    } else {
        // else create a new item using definitionName or next model number
        if (forceDynamicName) {
            if (settings.definitionPrefix === 'useLabel') {
                out = internals.nextModelName(definitionName + ' ', currentCollection);
            }
            else {
                out = internals.nextModelName('Model ', currentCollection);
            }
        }
        else {
            out = definitionName || internals.nextModelName('Model ', currentCollection);
        }
        currentCollection[out] = definition;
    }
    return out;
};


/**
 * formats a parameter for use in a definition object
 *
 * @param  {Object} parameter
 * @return {Object}
 */
internals.formatProperty = function (obj) {

    // add $ref directly to parent and delete schema
    //    if (obj.schema) {
    //        obj.$ref = obj.schema.$ref;
    //            delete obj.schema;
    //    }

    // remove emtpy properties
    obj = Utilities.deleteEmptyProperties(obj);

    // remove unneeded properties
    delete obj.name;

    return obj;
};


/**
 * creates a hash of a object
 *
 * @param  {Object} obj
 * @return {String}
 */
internals.hash = function (obj) {

    const str = JSON.stringify(obj);
    return Hash(str);
};


/**
 * creates a new unique model name
 *
 * @param  {String} nextModelNamePrefix
 * @param  {Object} currentCollection
 * @return {String}
 */
internals.nextModelName = function (nextModelNamePrefix, currentCollection) {
    let highest = 0;
    let key;
    for (key in currentCollection) {
        if (Utilities.startsWith(key, nextModelNamePrefix)) {
            let num = parseInt(key.replace(nextModelNamePrefix, ''), 10) || 0;
            if (num && num > highest) {
                highest = num;
            }
        }
    }
    return nextModelNamePrefix + (highest + 1);
};


/**
 * returns whether a collection already has a definition, returns key if found
 *
 *
 * @param  {Object} definition
 * @param  {Object} currentCollection
 * @return {String || Undefined}
 */
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
