'use strict';
var Hoek = require('hoek');

var Utilities = require('../lib/utilities');

var internals = {},
    properties = module.exports = {};

// swagger type can be "string", "number", "integer", "boolean", "array" or "file"
internals.simpleTypePropertyMap = {
    'boolean': { 'type': 'boolean' },
    'binary': { 'type': 'string', 'format': 'binary' },
    'date': { 'type': 'string', 'format': 'date' },
    'number': { 'type': 'number' },
    'string': { 'type': 'string' }
};

internals.complexTypePropertyMap = {
    'any': { 'type': 'string' },
    'array': { 'type': 'array' },
    'func': { 'type': 'string' },
    'object': { 'type': 'object' },
    'alternatives': { 'type': 'string' }
};

// merge
internals.propertyMap = Hoek.applyToDefaults(internals.simpleTypePropertyMap, internals.complexTypePropertyMap);


/**
 * builds a swagger definition object from a JOI object
 *
 * @param  {Object} joiObjs
 * @param  {Array} definitionCollection
 * @return {Object}
 */
properties.joiToSwaggerDefinition = function (joiObjs, definitionCollection) {

    return properties.parseProperties(joiObjs, definitionCollection);
};


/**
 * builds a swagger parameters object from a JOI object
 *
 * @param  {Object} joiObjs
 * @param  {String} type
 * @param  {Array} definitionCollection
 * @return {Object}
 */
properties.joiToSwaggerParameters = function (joiObjs, type, definitionCollection) {

    var x = properties.parseProperties(joiObjs, definitionCollection, type);
    return properties.swaggerObjectToArray(x, type);
};


/**
 * converts an object to an array of properties
 *
 * @param  {Object} obj
 * @param  {String} type
 * @return {Array}
 */
properties.swaggerObjectToArray = function (obj, type) {

    var out = [];
    var keys = Object.keys(obj);
    keys.forEach( function (element, index){

        var key = keys[index];
        var item = obj[key];
        item.name = key;
        if (type) {
            item.in = type;
        }
        out.push(item);
    });
    return out;
};


/**
 * turns JOI object into an array
 * needed to covert custom parameters objects passed in by plug-in route options
 *
 * @param  {Object} obj
 * @return {Array}
 */
properties.joiObjectToArray = function (obj) {

    var out = [];
    for (var key in obj) {
        out.push({
            key: key,
            schema: obj[key]
        });
    }
    return out;
};


/**
 * parse Joi validators object into an object of swagger properties
 *
 * @param  {Object || Array} joiObj
 * @param  {Array} definitionCollection
 * @return {Object}
 */
properties.parseProperties = function (joiObj, definitionCollection, type) {

    var i,
        joiChildObj,
        key,
        propertiesObj = {},
        x;

    if (!Utilities.isJoi(joiObj) && !Array.isArray(joiObj)){
        return {};
    }

    // if an object is pass get its array of child items
    if (Utilities.hasJoiChildren(joiObj)) {
        joiObj = joiObj._inner.children;
    }

    i = joiObj.length,
    x = 0;
    while (x < i) {
        key = joiObj[x].key;
        joiChildObj = joiObj[x].schema;
        propertiesObj[key] = properties.parseProperty(key, joiChildObj, definitionCollection, type);
        x++;
    }

    return Utilities.deleteEmptyProperties(propertiesObj);
};


/**
 * parse Joi validators object into a swagger property
 *
 * @param  {String} name
 * @param  {Object} joiObj
 * @param  {Array} definitionCollection
 * @return {Object}
 */
properties.parseProperty = function (name, joiObj, definitionCollection, type) {


    var property = { type: 'void' };

    // if wrong format or forbidden - return undefined
    if (!Utilities.isJoi(joiObj)){
        return undefined;
    }
    if (Hoek.reach(joiObj, '_flags.presence') === 'forbidden') {
        return undefined;
    }

    // add correct type and format by mapping
    var joiType = joiObj._type.toLowerCase();
    var map = internals.propertyMap[ joiType ];
    property.type = map.type;
    if ( map.format ){
        property.format = map.format;
    }

    // add common properties
    property.description = Hoek.reach(joiObj, '_description');
    property.notes = Hoek.reach(joiObj, '_notes');
    property.tags = Hoek.reach(joiObj, '_tags');
    property.example = Hoek.reach(joiObj, '_examples.0');

    // add reqired state only if true
    if (Hoek.reach(joiObj, '_flags.presence')) {
        property.required = (Hoek.reach(joiObj, '_flags.presence') === 'required') ? true : undefined;
    }
    property.default = Hoek.reach(joiObj, '_flags.default');

    // add enum
    var describe = joiObj.describe();
    if (Array.isArray(describe.valids) && describe.valids.length) {
        // fliter out empty values and arrays
        var enums = describe.valids.filter(function (item) {

            return item !== '';
        });
        if (enums.length > 0) {
            property.enum = enums;
        }
    }

    // add number properties
    if (property.type === 'number') {
        property = internals.parseNumber(property, joiObj);
    }

    // add object child properties
    if (property.type === 'object' && Utilities.hasJoiChildren(joiObj)) {
        property = internals.parseObject(property, joiObj, name, definitionCollection);
    }

    // add array properties
    if (property.type === 'array') {
        property = internals.parseArray(property, joiObj, name, definitionCollection, type);
    }

    // add file upload properties
    if (joiType === 'any' && Utilities.hasJoiMeta(joiObj)) {
        property = internals.parseAny(property, joiObj);
    }

    return Utilities.deleteEmptyProperties(property);
};


/**
 * parse number property
 *
 * @param  {Object} property
 * @param  {Object} joiObj
 * @return {Object}
 */
internals.parseNumber = function (property, joiObj) {

    var describe = joiObj.describe();
    property.minimum = internals.getArgByName(describe.rules, 'min');
    property.maximum = internals.getArgByName(describe.rules, 'max');
    if (internals.hasPropertyByName(describe.rules, 'integer')) {
        property.type = 'integer';
    }
    return property;
};


/**
 * parse object property
 *
 * @param  {Object} property
 * @param  {Object} joiObj
 * @param  {String} name
 * @param  {Object} definitionCollection
 * @return {Object}
 */
internals.parseObject = function (property, joiObj, name, definitionCollection) {

    var joiObjs = joiObj._inner.children;
    property.name = name;
    property.type = 'object';
    property.properties = properties.parseProperties(joiObjs, definitionCollection);
    return property;
};


/**
 * parse array property
 *
 * @param  {Object} property
 * @param  {Object} joiObj
 * @param  {String} name
 * @param  {Object} definitionCollection
 * @param  {String} type
 * @return {Object}
 */
internals.parseArray = function (property, joiObj, name, definitionCollection, type) {

    var describe = joiObj.describe();
    property.minItems = internals.getArgByName(describe.rules, 'min');
    property.maxItems = internals.getArgByName(describe.rules, 'max');

    // default the items with type:string
    property.items = {
        'type': 'string'
    };

    // set swaggers collectionFormat to one that works with hapi
    if (type === 'query' || type === 'formData'){
        property.collectionFormat = 'multi';
    }

    // swagger appears to only support one array type at a time, so grab the first one
    var arrayTypes = joiObj._inner.inclusions;
    var firstInclusionType = Utilities.first(arrayTypes);

    if (firstInclusionType) {
        // get className of embeded array
        if (name === 'items' && Array.isArray(joiObj._inner.inclusions[0]._meta)) {
            name = Utilities.getJoiMetaProperty(joiObj._inner.inclusions[0], 'className');
        }

        var arrayProperty = properties.parseProperty(name, firstInclusionType);
        if (internals.simpleTypePropertyMap[ firstInclusionType._type.toLowerCase() ]){
            // map simple types directly
            property.items = {
                'type': arrayProperty.type
            };
            if ( arrayProperty.format ){
                property.items.format = arrayProperty.format;
            }
        } else {
            // create definitions for complex types
            // delay invocation of dependency until runtime to deal with circular dependencies with properties
            property.items = {
                '$ref': '#/definitions/' + require('../lib/definitions').append(name, arrayProperty, definitionCollection)
            };
        }
    }

    return property;
};



/**
 * parse any property
 *
 * @param  {Object} property
 * @param  {Object} joiObj
 * @return {Object}
 */
internals.parseAny = function (property, joiObj) {

    if (Utilities.getJoiMetaProperty(joiObj, 'swaggerType') === 'file'){
        property.type = 'file';
        property.in = 'formData';
    }
    return property;
};


/**
 * return the value of an item in array of object by name - structure [ { name: 'value' } ]
 *
 * @param  {Array} array
 * @param  {String} name
 * @return {String || Undefined}
 */
internals.getArgByName = function (array, name) {

    if (Array.isArray(array)) {
        var i = array.length;
        while (i--) {
            if (array[i].name === name){
                return array[i].arg;
            }
        }
    }
    return undefined;
};


/**
 * return existance of an item in array of - structure [ { name: 'value' } ]
 *
 * @param  {Array} array
 * @param  {String} name
 * @return {Boolean}
 */
internals.hasPropertyByName = function (array, name) {

    return array && array.some(function (obj) {

        return obj.name === name;
    });
};
