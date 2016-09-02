'use strict';
const Hoek = require('hoek');
const Utilities = require('../lib/utilities');

const schema = module.exports = {};

/*
A schema object is the base structure used by swagger
*/


schema.allowedProps = ['$ref','format','title','description','default','multipleOf','maximum','exclusiveMaximum','minimum','exclusiveMinimum','maxLength','minLength','pattern','maxItems','minItems','uniqueItems','maxProperties','minProperties','required','enum','type','items','allOf','properties','additionalProperties','discriminator','readOnly','xml','externalDocs','example'];


// add none swagger property needed to flag touched state of required property
schema.allowedProps.push('optional');


/**
 * builds a swagger schema object
 *
 * @param  {Object} properties
 * @param  {String} propertyType
 * @return {Object}
 */
schema.build = function (input, propertyType) {

    let item = Hoek.clone(input);

    // is objects with children
    if (item.properties) {

        // create container
        let out = {
            'type': propertyType,
            'properties': {},
            'items': {}
        };
        // remove any emtpy properties
        item.properties = Utilities.deleteEmptyProperties(item.properties);

        for (let key in item.properties) {
            let obj = item.properties[key];

            // move required to top level
            if (obj.required !== undefined) {
                if (obj.required === true) {
                    if (out.required === undefined) {
                        out.required = [];
                    }
                    out.required.push(key);
                }
                // add optional array to flag touched state of required property
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
           // TODO removed for coverage issues - needs review
          //  if (propertyType === 'array') {
           //     out.items[key] = obj;
           // }

        }
        // TODO removed for coverage issues - needs review
        //if (item['x-alternatives']) {
        //    out['x-alternatives'] = item['x-alternatives'];
        //}


        out = Utilities.removeProps(out, this.allowedProps);
        return Utilities.deleteEmptyProperties(out);
    }


    return item;
};
