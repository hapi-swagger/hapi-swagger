const Hoek = require('@hapi/hoek');
const Joi = require('joi');

const utilities = (module.exports = {});

/**
 * is passed item an object
 *
 * @param  {Object} obj
 * @return {Boolean}
 */
utilities.isObject = function(obj) {
  return obj !== null && obj !== undefined && typeof obj === 'object' && !Array.isArray(obj);
};

/**
 * is passed item a function
 *
 * @param  {Object} obj
 * @return {Boolean}
 */
(utilities.isFunction = function(obj) {
  // remove `obj.constructor` test as it was always true
  return !!(obj && obj.call && obj.apply);
})
  /**
   * is passed item a regex
   *
   * @param  {Object} obj
   * @return {Boolean}
   */
  (utilities.isRegex = function(obj) {
    // base on https://github.com/ljharb/is-regex/
    // has a couple of edge use cases for different env  - hence coverage:off
    /* $lab:coverage:off$ */
    const regexExec = RegExp.prototype.exec;
    const tryRegexExec = function tryRegexExec(value) {
      try {
        regexExec.call(value);
        return true;
      } catch (e) {
        return false;
      }
    };

    const toStr = Object.prototype.toString;
    const regexClass = '[object RegExp]';
    const hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

    if (typeof obj !== 'object') {
      return false;
    }

    return hasToStringTag ? tryRegexExec(obj) : toStr.call(obj) === regexClass;
    /* $lab:coverage:on$ */
  });

/**
 * does an object have any of its own properties
 *
 * @param  {Object} obj
 * @return {Boolean}
 */
utilities.hasProperties = function(obj) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return true;
    }
  }

  return false;
};

/**
 * deletes any property in an object that is undefined, null or an empty array
 *
 * @param  {Object} obj
 * @return {Object}
 */
utilities.deleteEmptyProperties = function(obj) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // delete properties undefined values
      if (obj[key] === undefined) {
        delete obj[key];
      }

      // allow blank objects for example or default properties
      if (!['default', 'example', 'security'].includes(key)) {
        if (obj[key] === null) {
          delete obj[key];
        }

        // delete array with no values
        if (Array.isArray(obj[key]) && obj[key].length === 0) {
          delete obj[key];
        }

        // delete object which does not have its own properties
        if (utilities.isObject(obj[key]) && utilities.hasProperties(obj[key]) === false) {
          delete obj[key];
        }
      }
    }
  }

  return obj;
};

/**
 * gets first item of an array
 *
 * @param  {Array} array
 * @return {Object}
 */
utilities.first = function(array) {
  return Array.isArray(array) ? array[0] : undefined;
};

/**
 * sort array so it has a set firstItem
 *
 * @param  {Array<string>} array
 * @param  {string} firstItem
 * @return {Array}
 */
utilities.sortFirstItem = function(array, firstItem) {
  const input = Hoek.clone(array);

  if (!firstItem) {
    return input;
  }

  const filteredInput = input.filter((item) => item !== firstItem);

  return [ firstItem, ...filteredInput];
};

/**
 * replace a value in an array and keep order
 *
 * @param  {Array} inputArray
 * @param  {Object} current
 * @param  {Object} replacement
 * @return {Array}
 */
utilities.replaceValue = function(inputArray, current, replacement) {
  if (!inputArray || !current || !replacement) {
    return Hoek.clone(inputArray);
  }

  const array = Hoek.clone(inputArray);
  const index = array.indexOf(current);

  if (index !== -1) {
    array.splice(index, 1, replacement);
  }

  return array;
};

/**
 * does an object have a key
 *
 * @param  {Object} obj
 * @param  {string} findKey
 * @return {Boolean}
 */
utilities.hasKey = function(obj, findKey) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object') {
        if (this.hasKey(obj[key], findKey) === true) {
          return true;
        }
      }

      if (key === findKey) {
        return true;
      }
    }
  }

  return false;
};

/**
 * find and rename key in an object
 *
 * @param  {Object} obj
 * @param  {string} findKey
 * @param  {string} replaceKey
 * @return {Object}
 */
utilities.findAndRenameKey = function(obj, findKey, replaceKey) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object') {
        this.findAndRenameKey(obj[key], findKey, replaceKey);
      }

      if (key === findKey) {
        if (replaceKey) {
          obj[replaceKey] = obj[findKey];
        }

        delete obj[findKey];
      }
    }
  }

  return obj;
};

/**
	* remove any properties in an object that are not in the list or do not start with 'x-'
	*
	* @param  {Object} obj
    * @param  {Array} listOfProps

	* @return {Object}
	*/
utilities.removeProps = function(obj, listOfProps) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (listOfProps.indexOf(key) === -1 && key.startsWith('x-') === false) {
        delete obj[key];
      }
    }
  }

  return obj;
};

/**
 * is a Joi object
 *
 * @param  {Object} joiObj
 * @return {Boolean}
 */
utilities.isJoi = function(joiObj) {
  return joiObj && Joi.isSchema(joiObj)
};

/**
 * does JOI object have children
 *
 * @param  {Object} joiObj
 * @return {Boolean}
 */
utilities.hasJoiChildren = function(joiObj) {
  if (!(utilities.isJoi(joiObj))) {
    return false;
  }

  const byId = Hoek.reach(joiObj, '_ids._byId')
  const byKey = Hoek.reach(joiObj, '_ids._byKey')

  // TODO add tests to cover "byId.size > 0"
  return byKey.size > 0 || byId.size > 0;
};

/**
 * does JOI object have description
 *
 * @param  {Object} joiObj
 * @return {Boolean}
 */
utilities.hasJoiDescription = function(joiObj) {
  if (!utilities.isJoi(joiObj)) {
    return false;
  }

  return !!Hoek.reach(joiObj, '_flags.description');
};

/**
 * checks if object has meta array
 *
 * @param  {Object} joiObj
 * @return {Boolean}
 */
utilities.hasJoiMeta = function(joiObj) {
  return utilities.isJoi(joiObj) && joiObj.$_terms.metas.length > 0;
};

/**
 * get meta property value from JOI object
 *
 * @param  {Object} joiObj
 * @param  {string} propertyName
 * @return {Object || Undefined}
 */
utilities.getJoiMetaProperty = function(joiObj, propertyName) {
  // get headers added using meta function
  if (utilities.isJoi(joiObj) && utilities.hasJoiMeta(joiObj)) {
    const meta = joiObj.$_terms.metas;
    let i = meta.length;
    while (i--) {
      if (meta[i][propertyName]) {
        return meta[i][propertyName];
      }
    }
  }

  return undefined;
};

/**
 * get label from Joi object
 *
 * @param  {Object} joiObj
 * @return {String || Null}
 */
utilities.getJoiLabel = function(joiObj) {
  // old version
  /* $lab:coverage:off$ */
  const label = Hoek.reach(joiObj, '_settings.language.label');

  if (label) {
    return label;
  }

  /* $lab:coverage:on$ */
  // Joi > 10.9
  return Hoek.reach(joiObj, '_flags.label') || null;
};

/**
 * returns a javascript object into JOI object
 * needed to covert custom parameters objects passed in by plug-in route options
 *
 * @param  {Object} obj
 * @return {Object}
 */
utilities.toJoiObject = function(obj) {
  if (!utilities.isJoi(obj) && utilities.isObject(obj)) {
    return Joi.object(obj);
  }

  return obj;
};

/**
 * get chained functions for sorting
 *
 * @return {Function}
 */
utilities.firstBy = (function() {
  // code from https://github.com/Teun/thenBy.js
  // has its own tests
  /* $lab:coverage:off$ */
  const makeCompareFunction = function(f, direction) {
    if (typeof f !== 'function') {
      const prop = f;
      // make unary function
      f = function(v1) {
        return v1[prop];
      };
    }

    if (f.length === 1) {
      // f is a unary function mapping a single item to its sort score
      const uf = f;
      f = function(v1, v2) {
        return uf(v1) < uf(v2) ? -1 : uf(v1) > uf(v2) ? 1 : 0;
      };
    }

    if (direction === -1) {
      return function(v1, v2) {
        return -f(v1, v2);
      };
    }

    return f;
  };

  /* mixin for the `thenBy` property */
  const extend = function(f, d) {
    f = makeCompareFunction(f, d);
    f.thenBy = tb;
    return f;
  };

  /* adds a secondary compare function to the target function (`this` context)
       which is applied in case the first one returns 0 (equal)
       returns a new compare function, which has a `thenBy` method as well */
  const tb = function(y, d) {
    const self = this;
    y = makeCompareFunction(y, d);
    return extend((a, b) => {
      return self(a, b) || y(a, b);
    });
  };

  return extend;
  /* $lab:coverage:on$ */
})();

/**
 * create id
 *
 * @param  {string} method
 * @param  {string} path
 * @return {string}
 */
utilities.createId = function(method, path) {
  const self = this;

  if (!path.includes('/')) {
    return method.toLowerCase() + self.toTitleCase(path);
  }

  const result = path
    .split('/')
    .map((item) => {
      // replace chars such as '{'
      const updatedItem = item.replace(/[^\w\s]/gi, '');
      return self.toTitleCase(updatedItem);
    })
    .join('');

  return method.toLowerCase() + result;
};

/**
 * create toTitleCase
 *
 * @param  {string} word
 * @return {string}
 */
utilities.toTitleCase = function(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

/**
 * applies path replacements
 *
 * @param  {string} path
 * @param  {Array} applyTo
 * @param  {Array} options
 * @return {string}
 */
utilities.replaceInPath = function(path, applyTo, options) {
  options.forEach(option => {
    if (applyTo.includes(option.replaceIn) || option.replaceIn === 'all') {
      path = path.replace(option.pattern, option.replacement);
    }
  });
  return path;
};

/**
 * removes trailing slash `/` from a string
 *
 * @param  {string} str
 * @return {string}
 */
utilities.removeTrailingSlash = function(str) {
  return str.endsWith('/') ? str.slice(0, -1) : str;
};

/**
 * Assign vendor extensions: x-* to the target. This mutates target.
 *
 * @param  {Object} target
 * @param  {Object} source
 * @return {Object}
 */
utilities.assignVendorExtensions = function(target, source) {
  if (!this.isObject(target) || !this.isObject(source)) {
    return target;
  }

  for (const sourceProperty in source) {
    if (sourceProperty.startsWith('x-') && sourceProperty.length > 2) {
      // this may override existing x- properties which should not be an issue since values should be identical.
      target[sourceProperty] = Hoek.reach(source, sourceProperty) || null;
    }
  }

  return target;
};

/**
 * appends a querystring to an url
 *
 * @param  {string} url
 * @param  {string} qsName
 * @param  {string} qsValue
 * @return {string}
 */
utilities.appendQueryString = function (url, qsName, qsValue) {
   if (!qsName || !qsValue) {
     return url;
   }

  const query = new URLSearchParams({[qsName]: qsValue});

  return `${url}?${query.toString()}`;
};
