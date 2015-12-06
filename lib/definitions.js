'use strict';
var Hoek = require('hoek');

var Properties = require('../lib/properties'),
    Utilities = require('../lib/utilities');

var definitions = module.exports = {},
    internals = {};


/**
 * creates a new definition object
 *
 * @param  {Object} joiObj
 * @param  {Object} collection
 * @return {Object}
 */
definitions.createDefinition = function (joiObj, collection) {

    // TODO changes this to new method
    var properties = Properties.parseProperties(joiObj, collection);
    var propertyArray = Properties.propertiesObjToArray(properties, null);
    return this.build(propertyArray);
};


definitions.appendDefinition = function (name, joiObj, collection, altName) {

    var definition = this.createDefinition(joiObj, collection),
        out = null;

    // find existing definition by this name
    var foundDefinition = collection[name];
    if (foundDefinition) {
        // deep compare objects
        if (Hoek.deepEqual(foundDefinition, definition)) {
            // return existing name if existing object is exactly the same
            out = name;
        } else {
            // create new definition with altName
            // to stop reuse of definition with same name but different structures
            collection[altName] = definition;
            out = altName;
        }
    } else {
        // create new definition
        collection[name || altName] = definition;
        out = [name || altName];
    }
    return out;
};


/**
 * builds definition object in the JSON schema structure
 *
 * @param  {Object} parameters
 * @return {Object}
 */
definitions.build = function (parameters) {

    var out = definitions.createObject(),
        props = definitions.createProperties(parameters);

    // merge in properties and required structures
    out = Hoek.merge(props, out);

    return out;
};



/**
 * builds basic definition object
 *
 * @return {Object}
 */
definitions.createObject = function () {

    return {
        'type': 'object',
        'properties': {}
    };
};


/**
 * builds definition object properties structure
 *
 * @param  {Object} parameters
 * @return {Object}
 */
definitions.createProperties = function (parameters) {

    var out = {
        properties: {}
    };

    //console.log(JSON.stringify(parameters))

    for (var key in parameters) {

        var obj = parameters[key];

        // move required to top level
        if (obj.required) {
            if (out.required === undefined) {
                out.required = [];
            }
            //out.required.push(obj.name || key);
            out.required.push(obj.name);
        }

        obj = Utilities.deleteEmptyProperties(obj);

        // recurse into child objects
        if (obj.type === 'object' && obj.properties) {
            out.properties[obj.name] = definitions.createProperties(obj.properties);
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
