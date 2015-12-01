/*
 * Builds the swagger JSON file path section
 */


'use strict';
var Hoek                    = require('hoek'),
    Boom                    = require('boom'),
    Joi                     = require('joi'),
    ShortId                 = require('shortid'),
    Group                   = require('../lib/group'),
    Utilities               = require('../lib/utilities');
	
    
var properties = module.exports = {},
    internals = {};	
    

properties.joiToSwaggerDefiniation = function( joiObjs, definitions ){
    return properties.parseProperties(joiObjs, definitions, []);
}

properties.joiToSwaggerParameters = function( joiObjs, type, definitions ){
    var x = properties.parseProperties(joiObjs, definitions, []);
    return properties.propertiesObjToArray(x, type); 
}
    
    

    
// converts an object to an array of properties
properties.propertiesObjToArray = function (properties, type) {
    var out = [];
    
    if (properties === null ||
        properties === undefined ||
        (typeof properties !== 'object')) {
        return [];
    }

    var keys = Object.keys(properties);
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var item = properties[key];
        if (!item) {
            continue;
        }
        item.name = key;
        
        if(type){
            item.in = type;
            if (item.type === "array") {
                item.allowMultiple = true;
            }  
        }
        out.push(item);
    }
   
    return out;
};
    

// parse Joi validators object into an object of swagger properties
properties.parseProperties = function (joiObj, definitions, requiredArray) {
    var i,
        x,
        key,
        joiChildObj,
        properties = {};

    if (joiObj === null ||
        joiObj === undefined ||
        (typeof joiObj !== 'object')) {
        return {};
    }

    // if top most object is a JOI object convert it
    if (joiObj.isJoi && joiObj._inner.children) {
        joiObj = joiObj._inner.children
    }

    if (Array.isArray(joiObj)) {
        i = joiObj.length,
        x = 0;
        
        while (x < i) {
            key = joiObj[x].key;
            joiChildObj = joiObj[x].schema;
            //properties[key] = properties.parse(key, param, definitions, requiredArray);
            properties[key] = this.parseProperty(key, joiChildObj, definitions, requiredArray);
            x++;
        }
    }
    
    //console.log(JSON.stringify(properties))
    return Utilities.deleteEmptyProperties( properties );
};  
    
    
    
    
    

/**
 * build the swagger path section
 *
 * @joiObj  {Object} joiObj
 * @return {Object || undefined}
 */		
properties.parseProperty = function( name, joiObj, definitions, requiredArray ){
    var property = {type: 'void'};
    
    
    // if wrong format or forbidden - return undefined
    if (joiObj === null ||
        joiObj === undefined ||
        (typeof joiObj !== 'object')) {
        return undefined;;
    }
    if (Hoek.reach(joiObj,'_flags.presence') === 'forbidden'){
        return undefined;
    }


    // create a definition and return that
    if (typeof joiObj.validate !== 'function') {
        return  properties.joiToSwaggerDefiniation( properties.objectToArray (joiObj), definitions )
        
        //property.type = internals.appendDefinition2( name, null, joiObj, definitions)
        //property.type = internals.appendDefinitionByName(name, joiObj, definitions);
        //return property;
    }

    if (joiObj.describe) {
        var describe = joiObj.describe();
        
        // add common properties
        property.type = joiObj._type.toLowerCase();
        property.description = Hoek.reach(joiObj, '_description');
        property.notes = Hoek.reach(joiObj, '_notes');
        property.tags = Hoek.reach(joiObj, '_tags');
        property.example = Hoek.reach(joiObj, '_examples.0');
        
        
        // add reqired state only if true
        if (Hoek.reach(joiObj,'_flags.presence')) {
            property.required = (Hoek.reach(joiObj,'_flags.presence') === 'required') ? true : undefined;
        }
        property.default = Hoek.reach(joiObj,'_flags.default');
        


        // add enum
        if (Array.isArray(describe.valids) && describe.valids.length) {
            var enums = describe.valids.filter(function (item) {
                return item !== undefined && item !== '';
            });
            if (enums.length) {
                property["enum"] = enums;
            }
        }


        // add number properties
        if (property.type === 'number') {
            property.minimum = internals.getArgByName(describe.rules, 'min');
            property.maximum = internals.getArgByName(describe.rules, 'max');
            if (internals.existsByName(describe.rules, 'integer')) {
                property.type = 'integer';
            }
        }


        // add object or child properties
        if (property.type === 'object' && joiObj._inner) {
            var joiObjs = (joiObj._inner.children) ? joiObj._inner.children : joiObj._inner;
            property.name = name;
            property.type = 'object'
            // property.properties = internals.validatorsToProperties(joiObjs, definitions, requiredArray);
            property.properties =  this.parseProperties(joiObjs, definitions, requiredArray); 
        }


        // add array properties
        if (property.type === 'array') {
            //console.log(JSON.stringify(describe.rules))
            property.minItems = internals.getArgByName(describe.rules, 'min');
            property.maxItems = internals.getArgByName(describe.rules, 'max');

            var arrayTypes = joiObj._inner ? joiObj._inner.inclusions : internals.getArgByName(describe.rules, 'includes');
            
            // swagger appears to only support one array type at a time, so lets grab the first one
            var firstInclusionType = internals.first(arrayTypes);
            if (firstInclusionType) {
                // get className of embeded array
                if(name === 'items'
                    && Hoek.reach(joiObj, '_inner.inclusions.0._meta')
                    && Array.isArray(joiObj._inner.inclusions[0]._meta)){

                    var meta = joiObj._inner.inclusions[0]._meta,
                        i = meta.length;
                    while (i--) {
                        if(meta[i].className){
                            name = meta[i].className
                        }
                    }
                }

                //var arrayProperty =  internals.validatorToProperty(name, firstInclusionType, definitions);
                var arrayProperty =  this.parseProperty(name, firstInclusionType);
                if (arrayProperty['enum']) {
                    property.items = {
                        'type': arrayProperty.type,
                        'enum': arrayProperty['enum']
                    };
                } else {
                    if(arrayProperty.type === 'string'){
                        property.items = {
                            'type': arrayProperty.type
                        };
                    }else{
                        property.items = {
                            '$ref': '#/definitions/' + name
                        };
                    }

                }
            }
        }

        // add file 
        if (property.type === 'any') {
            var i = joiObj._meta.length;
            while (i--) {
                if(joiObj._meta[i].swaggerType
                    && joiObj._meta[i].swaggerType === 'file'){
                    property.type = "file";
                    property.in = "body";
                }
            }
        }

    }



    // if a required array is present use that for required fields instead of a flag
 //   if (requiredArray) {
 //       if (property.required) {
 //           requiredArray.push(name);
 //       }
 //       delete property.required;
 //   }

    return Utilities.deleteEmptyProperties( property );
	
}



// turns JOI object into parameters array
// needed to covert custom parameters objects passed in plug-in route options
properties.objectToArray = function (obj) {
     var out = [];
     for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            out.push({
                key: key,
                schema: obj[key]
            })
        }
     }
     return out;
}










// get arg value of an item in arrays of structure
//   [ { name: 'name', arg: 'arg' } ]
// or from two arrays
//   ['name'] [ {'0': 'arg'} ]
internals.getArgByName = function (array, name, args) {
    if (!Array.isArray(array)) {
        return;
    }

    if (args) {
        var location = names.lastIndexOf(name);
        if (~location && args[location]) {
            return args[location]['0'];
        }
        return;
    }

    for (var i = array.length - 1; i >= 0; i--) {
        if (array[i].name === name) {
            return array[i].arg;
        }
    }
};




// get existance of an item in array of structure [ { name: 'name' } ]
internals.existsByName = function (array, name) {
    return array && array.some(function (v) {
        return v.name === name;
    });
};




// get existance of an item in array of structure [ { name: 'name' } ]
internals.appendByName = function (joiName, propertyName, joiObj, property) {
    var joiValue = Hoek.reach(joiObj,joiName)
    if(joiValue){
        if(Array.isArray(joiValue)){
            if(joiValue.length > 0){
               property[propertyName] = joiValue
            }
        }else{
            property[propertyName] = joiValue
        }
    }
};


internals.first = function first(array) {
    return array ? array[0] : undefined;
};
