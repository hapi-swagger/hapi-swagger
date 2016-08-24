'use strict';
const Utilities = require('../lib/utilities');

const parameters = module.exports = {};


/**
 * takes a swagger schema object and returns a parameters object
 *
 * @param  {Object} schemaObj
 * @param  {String} parameterType
 * @return {Object}
 */
parameters.fromProperties = function (schemaObj, parameterType) {

    let out = [];

    // remove unwanted properties
    delete schemaObj.name;

    if (schemaObj.$ref || !schemaObj.properties) {
        let newParameter = {
            'in': parameterType,
            'name': parameterType,
            'schema': schemaObj
        };
        // reinstate x-alternatives at parameter level
        if (schemaObj['x-alternatives']) {
            newParameter['x-alternatives'] = schemaObj['x-alternatives'];
            delete newParameter.schema['x-alternatives'];
        }
        out.push(Utilities.deleteEmptyProperties(newParameter));
    } else {

        // object to array
        const keys = Object.keys(schemaObj.properties);
        keys.forEach((element, index) => {

            let key = keys[index];
            let item = schemaObj.properties[key];
            item.name = key;
            item.in = parameterType;

            // reinstate required at parameter level
            if (schemaObj.required && schemaObj.required.indexOf(key) > -1) {
                item.required = true;
            }
            if (schemaObj.optional && schemaObj.optional.indexOf(key) > -1) {
                item.required = false;
            }

            out.push(item);
        });

    }
    return out;
};
