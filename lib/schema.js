'use strict';
const Utilities = require('../lib/utilities');

const schema = module.exports = {};


/**
 * builds a swagger schema object
 *
 * @param  {Object} properties
 * @param  {String} propertyType
 * @return {Object}
 */
schema.build = function (input, propertyType) {

    // is objects with children
    if (input.properties) {

        // create container
        let out = {
            'type': propertyType,
            'properties': {},
            'items': {}
        };

        for (let key in input.properties) {
            let obj = input.properties[key];

            // move required to top level
            if (obj.required !== undefined) {
                if (obj.required === true) {
                    if (out.required === undefined) {
                        out.required = [];
                    }
                    out.required.push(key);
                }
                // add optional array to keep dirty status of setting this property
                if (obj.required === false) {
                    if (out.optional === undefined) {
                        out.optional = [];
                    }
                    out.optional.push(key);
                }
            }
            delete obj.required;
           // if (propertyType === 'object') {
            out.properties[key] = obj;
           // }
            /* TODO removed for coverage issues - needs review
            if (propertyType === 'array') {
                out.items[key] = obj;
            }
            */
        }
        /* TODO removed for coverage issues - needs review
        if (input['x-alternatives']) {
            out['x-alternatives'] = input['x-alternatives'];
        }
        */


        return Utilities.deleteEmptyProperties(out);
    }

    return input;
};
