'use strict';
const Hoek = require('hoek');
const Utilities = require('../lib/utilities');

const internals = {};
const properties = module.exports = {};

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
 * builds a swagger parameters object from a JOI object
 *
 * @param  {Object} joiObj
 * @param  {String} type
 * @param  {Array} definitionCollection
 * @return {Object}
 */
properties.toParameters = function (joiObj, definitionCollection, type) {

    const propertyObj = properties.parseProperties(joiObj, definitionCollection, type);
    const keys = Object.keys(propertyObj);
    let out = [];
    // object to array
    keys.forEach( (element, index) => {

        let key = keys[index];
        let item = propertyObj[key];
        item.name = key;
        if (type) {
            item.in = type;
        }
        out.push(item);

    });
    return out;
};




/**
 * parse Joi validators object into an object of swagger properties
 *
 * @param  {Object || Array} joiObj
 * @param  {Array} definitionCollection
 * @param  {String} type
 * @return {Object}
 */
properties.parseProperties = function (joiObj, definitionCollection, type) {

    let propertiesObj = {};

    if (!Utilities.isJoi(joiObj) && !Array.isArray(joiObj)){
        return {};
    }

    // if an object is pass get its array of child items
    if (Utilities.hasJoiChildren(joiObj)) {
        joiObj = joiObj._inner.children;
    }

    if (Array.isArray(joiObj)){
        joiObj.forEach( (obj) => {

            let name = obj.key;
            let joiChildObj = obj.schema;
            // get name form label if set
            if (Hoek.reach(joiChildObj, '_settings.language.label')) {
                name = Hoek.reach(joiChildObj, '_settings.language.label');
            }
            propertiesObj[name] = properties.parseProperty(name, joiChildObj, definitionCollection, type);
        });
    }

    return Utilities.deleteEmptyProperties(propertiesObj);
};


/**
 * turns JOI object into an array
 * needed to covert custom parameters objects passed in by plug-in route options
 *
 * @param  {Object} obj
 * @return {Array}
 */
properties.joiObjectToArray = function (obj) {

    let out = [];
    for (let key in obj) {
        out.push({
            key: key,
            schema: obj[key]
        });
    }
    return out;
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


    let property = { type: 'void' };

    // if wrong format or forbidden - return undefined
    if (!Utilities.isJoi(joiObj)){
        return undefined;
    }
    if (Hoek.reach(joiObj, '_flags.presence') === 'forbidden') {
        return undefined;
    }

    // add correct type and format by mapping
    let joiType = joiObj._type.toLowerCase();
    let map = internals.propertyMap[ joiType ];
    property.type = map.type;
    if ( map.format ){
        property.format = map.format;
    }

    property = properties.parsePropertyMetadata(property, joiObj);

    // add enum
    let describe = joiObj.describe();
    if (Array.isArray(describe.valids) && describe.valids.length) {
        // fliter out empty values and arrays
        var enums = describe.valids.filter( (item) => {

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
 * parse property metadata
 *
 * @param  {Object} property
 * @param  {Object} joiObj
 * @return {Object}
 */
properties.parsePropertyMetadata = function (property, joiObj) {

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
    return property;
};


/**
 * parse number property
 *
 * @param  {Object} property
 * @param  {Object} joiObj
 * @return {Object}
 */
internals.parseNumber = function (property, joiObj) {

    const describe = joiObj.describe();
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

    joiObj = joiObj._inner.children;
    property.name = name;
    property.type = 'object';
    if (name) {
        property.schema = {
            '$ref': '#/definitions/' + require('../lib/definitions').appendJoi(name, joiObj, definitionCollection)
        };
    } else {
        property.properties = properties.parseProperties(joiObj, definitionCollection);
    }
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

    const describe = joiObj.describe();
    property.minItems = internals.getArgByName(describe.rules, 'min');
    property.maxItems = internals.getArgByName(describe.rules, 'max');

    // default the items with type:string
    property.items = {
        'type': 'string'
    };

    // set swaggers collectionFormat to one that works with hapi
    if (type === 'query' || type === 'formData') {
        property.collectionFormat = 'multi';
    }

    // swagger appears to only support one array type at a time, so grab the first one
    const arrayTypes = joiObj._inner.inclusions;
    const firstInclusionType = Utilities.first(arrayTypes);

    if (firstInclusionType) {
        // get name of embeded array
        if (Hoek.reach(joiObj._inner.inclusions[0], '_settings.language.label')) {
            name = Hoek.reach(joiObj._inner.inclusions[0], '_settings.language.label');
        }

        let arrayProperty = properties.parseProperty(name, firstInclusionType, definitionCollection);
        if (internals.simpleTypePropertyMap[firstInclusionType._type.toLowerCase()]) {
            // map simple types directly
            property.items = {
                'type': arrayProperty.type
            };
            if (arrayProperty.format) {
                property.items.format = arrayProperty.format;
            }
        } else {
            property.items = arrayProperty.schema;
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
 * return the value of an item in array of object by name - structure [ { name: 'value', arg: 'value' } ]
 *
 * @param  {Array} array
 * @param  {String} name
 * @return {String || Undefined}
 */
internals.getArgByName = function (array, name) {

    if (Array.isArray(array)) {
        let i = array.length;
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

    return array && array.some( (obj) => {

        return obj.name === name;
    });
};
