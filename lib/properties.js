const Hoek = require('@hapi/hoek');
const Definitions = require('../lib/definitions');
const Utilities = require('../lib/utilities');

const internals = {};

/**
 * constructor for properties
 *
 * @param  {Object} settings
 * @param  {Object} definitionCollection
 * @param  {Object} altDefinitionCollection
 * @param  {Array} definitionCache
 */
exports =
  module.exports =
  internals.properties =
    function (settings, definitionCollection, altDefinitionCollection, definitionCache) {
      this.settings = settings;
      this.definitionCollection = definitionCollection;
      this.altDefinitionCollection = altDefinitionCollection;
      // definitionCache has to be an array of two WeakMaps
      this.definitionCache = definitionCache;

      this.definitions = new Definitions(settings);

      // swagger type can be 'string', 'number', 'integer', 'boolean', 'array' or 'file'
      this.simpleTypePropertyMap = {
        boolean: { type: 'boolean' },
        binary: { type: 'string', format: 'binary' },
        date: { type: 'string', format: 'date' },
        number: { type: 'number' },
        string: { type: 'string' }
      };

      this.complexTypePropertyMap = {
        any: { type: 'string' },
        array: { type: 'array' },
        func: { type: 'string' },
        object: { type: 'object' },
        alternatives: { type: 'alternatives' }
      };

      // merge
      this.propertyMap = Hoek.applyToDefaults(this.simpleTypePropertyMap, this.complexTypePropertyMap);

      //this.allowedProps = ['$ref','format','title','description','default','multipleOf','maximum','exclusiveMaximum','minimum','exclusiveMinimum','maxLength','minLength','pattern','maxItems','minItems','uniqueItems','maxProperties','minProperties','required','enum','type','items','allOf','properties','additionalProperties','discriminator','readOnly','xml','externalDocs','example'];
      // add none swagger property needed to flag touched state of required property
      //this.allowedProps.push('optional');
    };

/**
 * parse Joi validators object into a swagger property
 *
 * @param  {string} name
 * @param  {Object} joiObj
 * @param  {string} parent
 * @param  {string} parameterType
 * @param  {Boolean} useDefinitions
 * @param  {Boolean} isAlt
 * @return {Object}
 */
internals.properties.prototype.parseProperty = function (name, joiObj, parent, parameterType, useDefinitions, isAlt) {
  let property = { type: 'void' };

  // if wrong format or forbidden - return undefined
  if (!Utilities.isJoi(joiObj)) {
    return undefined;
  }

  if (Hoek.reach(joiObj, '_flags.presence') === 'forbidden') {
    return undefined;
  }

  if (Utilities.getJoiMetaProperty(joiObj, 'swaggerHidden') === true) {
    return undefined;
  }

  // default the use of definitions to true
  if (useDefinitions === undefined || useDefinitions === null) {
    useDefinitions = true;
  }

  // get name from joi label if its not a path
  if (!name && parameterType !== 'path') {
    const joiLabel = Utilities.getJoiLabel(joiObj);
    if (joiLabel) {
      name = joiLabel;
    }
  }

  // add correct type and format by mapping
  let joiType = joiObj.type.toLowerCase();
  // for Joi extension, use the any type
  if (!(joiType in this.propertyMap)) {
    joiType = 'any';
  }

  const map = this.propertyMap[joiType];
  property.type = map.type;
  if (map.format) {
    property.format = map.format;
  }

  // this must be done even if the caching returns something
  this.setRequiredAndOptionalOnParent(name, parent, joiObj);

  // Joi object caching - speeds up parsing
  let joiCache;
  if (useDefinitions && Array.isArray(this.definitionCache) && property.type === 'object') {
    // select WeakMap for current definition collection
    joiCache = isAlt === true ? this.definitionCache[1] : this.definitionCache[0];
    if (joiCache.has(joiObj)) {
      return joiCache.get(joiObj);
    }
  }

  property = this.parsePropertyMetadata(property, name, parent, joiObj);

  // add enum
  const describe = joiObj.describe();
  const allowDropdown = !property['x-meta'] || !property['x-meta'].disableDropdown;
  if (allowDropdown && Array.isArray(describe.allow) && describe.allow.length) {
    if (
      describe.allow[0] &&
      typeof describe.allow[0] === 'object' &&
      describe.allow[0].override === true &&
      Object.keys(describe.allow[0]).length === 1
    ) {
      describe.allow.shift();
    }

    // filter out empty values and arrays
    const enums = describe.allow.filter((item) => {
      return item !== '' && item !== null;
    });
    if (enums.length > 0) {
      property.enum = enums;
    }
  }

  // add number properties
  if (property.type === 'string') {
    property = this.parseString(property, joiObj);
    if (useDefinitions === true && property.enum) {
      const refName = this.definitions.append(name, property, this.getDefinitionCollection(isAlt), this.settings);
      property = {
        $ref: this.getDefinitionRef(isAlt) + refName
      };
    }
  }

  // add number properties
  if (property.type === 'number') {
    property = this.parseNumber(property, joiObj);
  }

  // add date properties
  if (property.type === 'string' && property.format === 'date') {
    property = this.parseDate(property, joiObj);
  }

  // add object child properties
  if (property.type === 'object') {
    if (Utilities.hasJoiChildren(joiObj) || Utilities.hasJoiDescription(joiObj)) {
      property = this.parseObject(property, joiObj, name, parameterType, useDefinitions, isAlt);
      if (useDefinitions === true) {
        const refName = this.definitions.append(name, property, this.getDefinitionCollection(isAlt), this.settings);
        property = {
          $ref: this.getDefinitionRef(isAlt) + refName
        };
      }
    } else if (joiObj.$_terms.patterns) {
      const objectPattern = joiObj.$_terms.patterns[0];
      let patternName = 'string';
      if (objectPattern.schema) {
        patternName =
          objectPattern.schema.$_terms.examples && objectPattern.schema.$_terms.examples[0]
            ? objectPattern.schema.$_terms.examples[0]
            : objectPattern.schema.type;
      }

      property.properties = {
        [patternName]: this.parseProperty(
          patternName,
          objectPattern.rule,
          property,
          parameterType,
          useDefinitions,
          isAlt
        )
      };
    } else {
      // default empty object
      property.properties = {};
      if (useDefinitions === true) {
        const objectSchema = { type: 'object', properties: {} };
        const refName = this.definitions.append(name, objectSchema, this.getDefinitionCollection(isAlt), this.settings);
        property = {
          $ref: this.getDefinitionRef(isAlt) + refName
        };
      }
    }

    const allowUnknown = joiObj._flags.allowUnknown;
    if (allowUnknown !== undefined && !allowUnknown) {
      property.additionalProperties = false;
    }
  }

  // add array properties
  if (property.type === 'array') {
    property = this.parseArray(property, joiObj, name, parameterType, useDefinitions, isAlt);

    if (useDefinitions === true) {
      const refName = this.definitions.append(name, property, this.getDefinitionCollection(isAlt), this.settings);
      property = {
        $ref: this.getDefinitionRef(isAlt) + refName
      };
    }
  }

  // add alternatives properties
  if (property.type === 'alternatives') {
    property = this.parseAlternatives(property, joiObj, name, parameterType, useDefinitions);
  }

  // convert property to file upload, if indicated by meta property
  if (Utilities.getJoiMetaProperty(joiObj, 'swaggerType') === 'file') {
    property.type = 'file';
    property.in = 'formData';
  }

  property = Utilities.deleteEmptyProperties(property);
  if (joiCache && property.$ref) {
    joiCache.set(joiObj, property);
  }

  return property;
};

/**
 * set required and optional properties on parent if they do not exist yet
 *
 * @param  {string} name
 * @param  {string} parent
 * @param  {Object} joiObj
 * @returns {void}
 */
internals.properties.prototype.setRequiredAndOptionalOnParent = function (name, parent, joiObj) {
  // nothing needs to be done if the parent or the property doesn't exist
  if (!parent || !name) {
    return;
  }

  const describe = joiObj.describe();

  if (Hoek.reach(joiObj, '_flags.presence')) {
    if (parent.required === undefined) {
      parent.required = [];
    }

    if (parent.optional === undefined) {
      parent.optional = [];
    }

    if (Hoek.reach(joiObj, '_flags.presence') === 'required') {
      if (!parent.required.includes(name)) {
        parent.required.push(name);
      }
    }

    if (Hoek.reach(joiObj, '_flags.presence') === 'optional') {
      if (!parent.optional.includes(name)) {
        parent.optional.push(name);
      }
    }
  }

  // interdependencies are not yet supported https://github.com/OAI/OpenAPI-Specification/issues/256
  if (describe.whens && describe.whens.length > 0) {
    describe.whens.forEach((test) => {
      if (Hoek.reach(test, 'then.flags.presence') === 'required') {
        if (parent.required === undefined) {
          parent.required = [];
        }

        parent.required.push(name);
      }
    });
  }
};

/**
 * parse property metadata
 *
 * @param  {Object} property
 * @param  {Object} joiObj
 * @return {Object}
 */
internals.properties.prototype.parsePropertyMetadata = function (property, name, parent, joiObj) {
  const describe = joiObj.describe();

  // add common properties
  property.description = Hoek.reach(joiObj, '_flags.description');
  property.notes = Hoek.reach(joiObj, '$_terms.notes');
  property.tags = Hoek.reach(joiObj, '$_terms.tags');

  // add extended properties not part of openAPI spec
  if (this.settings.xProperties === true) {
    internals.convertRules(property, describe.rules, ['unit'], 'x-format');
    const exampleObj = Hoek.reach(joiObj, '$_terms.examples.0');
    /* $lab:coverage:off$ */
    // exampleObj.value != null will coerce undefined and null
    // eslint-disable-next-line no-eq-null
    property.example = exampleObj && exampleObj.value != null ? exampleObj.value : exampleObj;
    /* $lab:coverage:on$ */

    const xMeta = Hoek.reach(joiObj, '$_terms.metas.0');
    if (xMeta) {
      const meta = Hoek.clone(xMeta);
      delete meta.swaggerLabel;
      if (Object.keys(meta).length) {
        if ('xml' in meta) {
          property.xml = meta.xml;
          delete meta.xml;
        }

        property['x-meta'] = meta;
      }
    }
  }

  this.setRequiredAndOptionalOnParent(name, parent, joiObj);

  property.default = Hoek.reach(joiObj, '_flags.default');

  // allow for function calls
  if (Utilities.isFunction(property.default)) {
    property.default = property.default();
  }

  return property;
};

/**
 * parse string property
 *
 * @param  {Object} property
 * @param  {Object} joiObj
 * @return {Object}
 */
internals.properties.prototype.parseString = function (property, joiObj) {
  const describe = joiObj.describe();

  if (describe.type !== 'date') {
    property.minLength = internals.getArgByName(describe.rules, 'min', 'limit');
    property.maxLength = internals.getArgByName(describe.rules, 'max', 'limit');
  }

  // add regex
  joiObj._rules.forEach((test) => {
    if (Utilities.isObject(test.args) && test.args.regex) {
      if (Utilities.isRegex(test.args.regex)) {
        // get the regex source (as opposed to regex.toString()) so
        // we exclude the surrounding '/' delimeters as well as any
        // trailing flags (g, i, m)
        property.pattern = test.args.regex.source;
      } else {
        property.pattern = test.args.regex;
      }
    }
  });

  // add extended properties not part of openAPI spec
  if (this.settings.xProperties === true) {
    internals.convertRules(property, describe.rules, ['insensitive', 'length'], 'x-constraint');

    internals.convertRules(
      property,
      describe.rules,
      ['creditCard', 'alphanum', 'token', 'email', 'ip', 'uri', 'guid', 'hex', 'hostname', 'isoDate'],
      'x-format'
    );

    internals.convertRules(property, describe.rules, ['case', 'trim'], 'x-convert');
  }

  return property;
};

/**
 * parse number property
 *
 * @param  {Object} property
 * @param  {Object} joiObj
 * @return {Object}
 */
internals.properties.prototype.parseNumber = function (property, joiObj) {
  const describe = joiObj.describe();
  property.minimum = internals.getArgByName(describe.rules, 'min');
  property.maximum = internals.getArgByName(describe.rules, 'max');
  if (internals.hasPropertyByName(describe.rules, 'integer')) {
    property.type = 'integer';
  }

  if (Array.isArray(describe.metas)) {
    const meta = describe.metas.find((meta) => {
      return typeof meta.format === 'string';
    });
    if (meta) {
      property.format = meta.format;
    }
  }

  // add extended properties not part of openAPI spec
  if (this.settings.xProperties === true) {
    internals.convertRules(
      property,
      describe.rules,
      ['greater', 'less', 'precision', 'multiple', 'sign'],
      'x-constraint'
    );
  }

  return property;
};

/**
 * parse date property - adds additional schema info based on Joi date formats
 *
 * @param  {Object} input
 * @param  {Object} joiObj
 * @return {Object}
 */
internals.properties.prototype.parseDate = function (input, joiObj) {
  const dateFormat = Hoek.reach(joiObj, '_flags.format');
  const property = Hoek.clone(input);

  if (['timestamp', 'javascript'].includes(dateFormat)) {
    // Seems like the exact name of the format differs for different versions of Joi
    // Javascript is what is set by Joi.date().timestamp()
    property.type = 'integer';
    delete property.format;
  } else if (dateFormat === 'iso') {
    // Joi.date().iso()
    property.type = 'string';
    property.format = 'date-time';
  }

  return property;
};

/**
 * parse object property
 *
 * @param  {Object} property
 * @param  {Object} joiObj
 * @param  {string} name
 * @param  {Boolean} useDefinitions
 * @param  {Boolean} isAlt
 * @return {Object}
 */
internals.properties.prototype.parseObject = function (property, joiObj, name, parameterType, useDefinitions, isAlt) {
  property.properties = {};

  joiObj._ids._byKey.forEach((obj) => {
    const keyName = obj.id;
    let itemName = obj.id;
    const joiChildObj = obj.schema;

    // get name form label if set
    if (Utilities.getJoiLabel(joiChildObj)) {
      itemName = Utilities.getJoiLabel(joiChildObj);
    }

    //name, joiObj, parent, parameterType, useDefinitions, isAlt
    property.properties[keyName] = this.parseProperty(
      itemName,
      joiChildObj,
      property,
      parameterType,
      useDefinitions,
      isAlt
    );
    // switch references if naming has changed
    if (keyName !== itemName) {
      property.required = Utilities.replaceValue(property.required, itemName, keyName);
      property.optional = Utilities.replaceValue(property.optional, itemName, keyName);
    }
  });
  return property;
};

/**
 * parse array property
 *
 * @param  {Object} property
 * @param  {Object} joiObj
 * @param  {string} name
 * @param  {string} parameterType,
 * @param  {Boolean} useDefinitions
 * @param  {Boolean} isAlt
 * @return {Object}
 */
internals.properties.prototype.parseArray = function (property, joiObj, name, parameterType, useDefinitions, isAlt) {
  const describe = joiObj.describe();
  property.minItems = internals.getArgByName(describe.rules, 'min');
  property.maxItems = internals.getArgByName(describe.rules, 'max');

  // add extended properties not part of openAPI spec
  if (this.settings.xProperties === true) {
    internals.convertRules(property, describe.rules, ['length', 'unique'], 'x-constraint');

    if (describe.flags && describe.flags.sparse) {
      internals.addToPropertyObject(property, 'x-constraint', 'sparse', true);
    }

    if (describe.flags && describe.flags.single) {
      internals.addToPropertyObject(property, 'x-constraint', 'single', true);
    }
  }

  // default the items with type:string
  property.items = {
    type: 'string'
  };

  // set swaggers collectionFormat to one that works with hapi
  if (parameterType === 'query' || parameterType === 'formData') {
    property.collectionFormat = 'multi';
  }

  // swagger appears to only support one array item type at a time, so grab the first one
  const arrayItemTypes = joiObj.$_terms.items;
  const arrayItem = Utilities.first(arrayItemTypes);

  if (arrayItem) {
    // get name of item if it has one
    let itemName;
    if (Utilities.getJoiLabel(arrayItem)) {
      itemName = Utilities.getJoiLabel(arrayItem);
    }

    //name, joiObj, parent, parameterType, useDefinitions, isAlt
    const arrayItemProperty = this.parseProperty(itemName, arrayItem, property, parameterType, useDefinitions, isAlt);
    if (this.simpleTypePropertyMap[arrayItem.type.toLowerCase()]) {
      // map simple types directly
      property.items = {};
      for (const key in arrayItemProperty) {
        property.items[key] = arrayItemProperty[key];
      }
    } else {
      property.items = arrayItemProperty;
    }
  }

  property.name = name;
  return property;
};

/**
 * parse alternatives property
 *
 * @param  {Object} property
 * @param  {Object} joiObj
 * @param  {string} name
 * @param  {string} parameterType
 * @param  {Boolean} useDefinitions
 * @return {Object}
 */
internals.properties.prototype.parseAlternatives = function (property, joiObj, name, parameterType, useDefinitions) {
  // convert .try() alternatives structures
  if (Hoek.reach(joiObj, '$_terms.matches.0.schema')) {
    // add first into definitionCollection
    const child = joiObj.$_terms.matches[0].schema;
    const childName = Utilities.getJoiLabel(joiObj);
    //name, joiObj, parent, parameterType, useDefinitions, isAlt
    property = this.parseProperty(childName, child, property, parameterType, useDefinitions, false);

    // create the alternatives without appending to the definitionCollection
    // if (property && this.settings.xProperties === true) {
    if (this.settings.xProperties === true) {
      const altArray = joiObj.$_terms.matches
        .map((obj) => {
          const childMetaName = Utilities.getJoiMetaProperty(obj.schema, 'swaggerLabel');
          const altName = childMetaName || Utilities.getJoiLabel(obj.schema) || name;

          //name, joiObj, parent, parameterType, useDefinitions, isAlt
          return this.parseProperty(altName, obj.schema, property, parameterType, useDefinitions, true);
        })
        .filter((obj) => obj);
      property['x-alternatives'] = Hoek.clone(altArray);
    }
  }

  // convert .when() alternatives structures
  else {
    // add first into definitionCollection
    const child = joiObj.$_terms.matches[0].then;
    const childMetaName = Utilities.getJoiMetaProperty(child, 'swaggerLabel');
    const childName = childMetaName || Utilities.getJoiLabel(child) || name;
    //name, joiObj, parent, parameterType, useDefinitions, isAlt
    property = this.parseProperty(childName, child, property, parameterType, useDefinitions, false);

    // create the alternatives without appending to the definitionCollection
    if (property && this.settings.xProperties === true) {
      const altArray = joiObj.$_terms.matches
        .reduce((res, obj) => {
          obj.then && res.push(obj.then);
          obj.otherwise && res.push(obj.otherwise);
          return res;
        }, [])
        .map((joiNewObj) => {
          const childMetaName = Utilities.getJoiMetaProperty(joiNewObj, 'swaggerLabel');
          const altName = childMetaName || Utilities.getJoiLabel(joiNewObj) || name;
          return this.parseProperty(altName, joiNewObj, property, parameterType, useDefinitions, true);
        })
        .filter((obj) => obj);
      property['x-alternatives'] = Hoek.clone(altArray);
    }
  }

  return property;
};

/**
 * selects the correct definition collection
 *
 * @param  {Boolean} isAlt
 * @return {Object}
 */
internals.properties.prototype.getDefinitionCollection = function (isAlt) {
  return isAlt === true ? this.altDefinitionCollection : this.definitionCollection;
};

/**
 * selects the correct definition reference
 *
 * @param  {Boolean} isAlt
 * @return {string}
 */
internals.properties.prototype.getDefinitionRef = function (isAlt) {
  return isAlt === true ? '#/x-alt-definitions/' : '#/definitions/';
};

/**
 * coverts rules into property objects
 *
 * @param  {Object} property
 * @param  {Array} rules
 * @param  {Array} ruleNames
 * @param  {string} groupName
 */
internals.convertRules = function (property, rules, ruleNames, groupName) {
  ruleNames.forEach((ruleName) => {
    internals.appendToPropertyObject(property, rules, groupName, ruleName);
  });
};

/**
 * appends a name item to object on a property
 *
 * @param  {Object} property
 * @param  {Array} rules
 * @param  {string} groupName
 * @param  {string} ruleName
 */
internals.appendToPropertyObject = function (property, rules, groupName, ruleName) {
  if (internals.hasPropertyByName(rules, ruleName)) {
    let value = internals.getArgByName(rules, ruleName);
    if (Utilities.isObject(value) && Utilities.hasProperties(value) === false) {
      value = undefined;
    }

    internals.addToPropertyObject(property, groupName, ruleName, value);
  }
};

/**
 * add a name item to object on a property
 *
 * @param  {Object} property
 * @param  {string} groupName
 * @param  {string} ruleName
 * @param  {string} value
 */
internals.addToPropertyObject = function (property, groupName, ruleName, value) {
  if (!property[groupName]) {
    property[groupName] = {};
  }

  property[groupName][ruleName] = value !== undefined ? value : true;
};

/**
 * return the value of an item in array of object by name - structure [ { name: 'value', arg: 'value' } ]
 *
 * @param  {Array} array
 * @param  {string} name
 * @return {String || Undefined}
 */
internals.getArgByName = function (array, name, key = undefined) {
  if (Array.isArray(array)) {
    let i = array.length;
    while (i--) {
      if (array[i].name === name) {
        if (array[i].args) {
          if (key) {
            return array[i].args[key];
          }

          // If not specified, return first
          return Object.values(array[i].args)[0];
        }

        // TODO check why we return true if we  must return a string or undefined
        return true;
      }
    }
  }

  return undefined;
};

/**
 * return existence of an item in array of - structure [ { name: 'value' } ]
 *
 * @param  {Array} array
 * @param  {string} name
 * @return {Boolean}
 */
internals.hasPropertyByName = function (array, name) {
  return Array.isArray(array) && array.some((obj) => obj.name === name);
};
