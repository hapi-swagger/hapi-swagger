const Hoek = require('@hapi/hoek');
const Utilities = require('../lib/utilities');

const parameters = (module.exports = {});

parameters.allowedProps = [
  'name',
  'in',
  'description',
  'required',
  'schema',
  'type',
  'format',
  'allowEmptyValue',
  'items',
  'collectionFormat',
  'default',
  'maximum',
  'exclusiveMaximum',
  'minimum',
  'exclusiveMinimum',
  'maxLength',
  'minLength',
  'pattern',
  'maxItems',
  'minItems',
  'uniqueItems',
  'enum',
  'multipleOf'
];
//parameters.allowedParameterTypes = ['body','path','header','query','formData','file'];

// add none swagger property needed to flag touched state of required property
parameters.allowedProps.push('optional');

/**
 * takes a swagger schema object and returns a parameters object
 *
 * @param  {Object} schemaObj
 * @param  {String} parameterType
 * @return {Object}
 */
parameters.fromProperties = function(schemaObj, parameterType) {
  let out = [];
  // if (this.allowedParameterTypes.indexOf(parameterType) === -1) {
  //     return out;
  // }

  // if its a single parameter
  if (schemaObj.properties === undefined) {
    // console.log('a', JSON.stringify(schemaObj) + '\n');

    let item = Hoek.clone(schemaObj);
    item.in = parameterType;
    item.name = parameterType;
    item.schema = {};
    item.schema.type = item.type;
    delete item.type;

    // convert an object definition
    if (item.$ref) {
      item.schema.$ref = item.$ref;
      // item.schema.type = 'object'; // should have to do this but causes validations issues
      delete item.$ref;
    }

    // reinstate x-alternatives at parameter level
    if (schemaObj['x-alternatives']) {
      item['x-alternatives'] = schemaObj['x-alternatives'];
      delete item.schema['x-alternatives'];
    }

    item = Utilities.removeProps(item, this.allowedProps);
    if (!Hoek.deepEqual(item.schema, { type: 'object' }, { prototype: false })) {
      // Clean up item shallow level properties and schema nested properties
      item = Utilities.deleteEmptyProperties(item);
      item.schema = Utilities.deleteEmptyProperties(item.schema);

      out.push(item);
    }

    // if its an array of parameters
  } else {
    //console.log('b', JSON.stringify(schemaObj) + '\n');

    // object to array
    const keys = Object.keys(schemaObj.properties);
    keys.forEach((element, index) => {
      let key = keys[index];
      let item = schemaObj.properties[key];
      item.name = key;
      item.in = parameterType;

      // reinstate required at parameter level
      if (schemaObj.required && (schemaObj.properties[key].required || schemaObj.required.indexOf(key) > -1)) {
        item.required = true;
      }
      if (schemaObj.optional && schemaObj.optional.indexOf(key) > -1) {
        item.required = false;
      }

      item = Utilities.removeProps(item, this.allowedProps);
      out.push(item);
    });
  }
  return out;
};
