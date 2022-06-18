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

parameters.itemsObjectProperties = ['type', 'format', 'items', 'collectionFormat', 'default', 'maximum', 'exclusiveMaximum', 'minimum', 'exclusiveMinimum', 'maxLength', 'minLength', 'pattern', 'maxItems', 'minItems', 'uniqueItems', 'enum', 'multipleOf'];

/**
 * takes a swagger schema object and returns a parameters object
 *
 * @param  {Object} schemaObj
 * @param  {string} parameterType
 * @return {Object}
 */
parameters.fromProperties = function(schemaObj, parameterType) {
  const out = [];
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

    Object.keys(schemaObj.properties).forEach((key) => {
      let item = schemaObj.properties[key];

      if (typeof item === 'undefined' ) {
        return;
      }

      item.name = key;
      item.in = parameterType;

      // reinstate required at parameter level
      delete item.required;
      if (schemaObj.required && (item.required || schemaObj.required.includes(key))) {
        item.required = true;
      }

      if (schemaObj.optional && schemaObj.optional.includes(key)) {
        item.required = false;
      }

      // object is not a valid parameter type in v2.0, replacing it with string
      this.replaceObjectsWithStrings(item);

      item = this.removePropsRecursively(item);
      out.push(item);
    });
  }

  return out;
};

parameters.replaceObjectsWithStrings = function (item) {
  if(item.type === 'object'){
    item.type = 'string';
    item['x-type'] = 'object';
    Utilities.findAndRenameKey(item, 'properties', 'x-properties')
  }

  if(item.items){ // repeat for array items
    this.replaceObjectsWithStrings(item.items);
  }
}

parameters.removePropsRecursively = function (item, props=this.allowedProps){
  item = Utilities.removeProps(item, props);
  if(item.items){ // repeat for array items
    this.removePropsRecursively(item.items, this.itemsObjectProperties)
  }

  return item;
}
