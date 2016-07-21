'use strict';
const Hoek = require('hoek');

const utilities = module.exports = {};


/**
	* is passed item an object
	*
	* @param  {Object} obj
	* @return {Boolean}
	*/
utilities.isObject = function (obj) {

    return obj !== null && obj !== undefined && typeof obj === 'object' && !Array.isArray(obj);
};


/**
     * is passed item a function
     *
     * @param  {Object} obj
     * @return {Boolean}
     */
utilities.isFunction = function (obj) {

    // remove `obj.constructor` test as it was always true
    return !!(obj && obj.call && obj.apply);
},



/**
	* does string start with test, temp before native support
	*
	* @param  {String} str
    * @param  {String} str
	* @return {Boolean}
	*/
utilities.startsWith = function (str, test) {

    return (str.indexOf(test) === 0);
};


/**
	* does an object have any of its own properties
	*
	* @param  {Object} obj
	* @return {Boolean}
	*/
utilities.hasProperties = function (obj) {

    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
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
utilities.deleteEmptyProperties = function (obj) {

    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            // delete properties undefined values
            if (obj[key] === undefined || obj[key] === null) {
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
    return obj;
};


/**
    * gets first item of an array
    *
    * @param  {Array} array
    * @return {Object}
    */
utilities.first = function (array) {

    return Array.isArray(array) ? array[0] : undefined;
};


/**
    * sort array so it has a set firstItem
    *
    * @param  {Array} array
    * @param  {Obj} firstItem
    * @return {Array}
    */
utilities.sortFirstItem = function (array, firstItem) {

    let out = array;
    if (firstItem) {
        out = [firstItem];
        array.forEach(function (item) {

            if (item !== firstItem) {
                out.push(item);
            }
        });
    }
    return out;
};


/**
 * is a Joi object
 *
 * @param  {Object} joiObj
 * @return {Boolean}
 */
utilities.isJoi = function (joiObj) {

    return (joiObj && joiObj.isJoi) ? true : false;
};


/**
 * does JOI object have children
 *
 * @param  {Object} joiObj
 * @return {Boolean}
 */
utilities.hasJoiChildren = function (joiObj) {

    return (utilities.isJoi(joiObj) && Hoek.reach(joiObj,'_inner.children')) ? true : false;
};


/**
 * checks if object has meta array
 *
 * @param  {Object} joiObj
 * @return {Boolean}
 */
utilities.hasJoiMeta = function (joiObj) {

    return (utilities.isJoi(joiObj) && Array.isArray(joiObj._meta)) ? true : false;
};


/**
 * get meta property value from JOI object
 *
 * @param  {Object} joiObj
 * @param  {String} propertyName
 * @return {Object || Undefined}
 */
utilities.getJoiMetaProperty = function (joiObj, propertyName) {

    // get headers added using meta function
    if (utilities.isJoi(joiObj) && utilities.hasJoiMeta(joiObj)) {

        const meta = joiObj._meta;
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
utilities.geJoiLabel = function (joiObj) {

    // old version
    /* $lab:coverage:off$ */
    if (Hoek.reach(joiObj, '_settings.language.label')) {
        return Hoek.reach(joiObj, '_settings.language.label');
    }
    /* $lab:coverage:on$ */
    // Joi > 10.9
    if (Hoek.reach(joiObj, '_flags.label')) {
        return Hoek.reach(joiObj, '_flags.label');
    }

    return null;
};


/**
 * get chained functions for sorting
 *
 * @return {Function}
 */
utilities.firstBy = (function () {

    // code from https://github.com/Teun/thenBy.js
    // has its own tests
    /* $lab:coverage:off$ */
    var makeCompareFunction = function (f, direction) {

        if (typeof (f) !== 'function') {
            var prop = f;
            // make unary function
            f = function (v1) {

                return v1[prop];
            };
        }
        if (f.length === 1) {
            // f is a unary function mapping a single item to its sort score
            var uf = f;
            f = function (v1, v2) {

                return uf(v1) < uf(v2) ? -1 : uf(v1) > uf(v2) ? 1 : 0;
            };
        }
        if (direction === -1) {
            return function (v1, v2) {

                return -f(v1, v2);
            };
        }
        return f;
    };
    /* mixin for the `thenBy` property */
    var extend = function (f, d) {

        f = makeCompareFunction(f, d);
        f.thenBy = tb;
        return f;
    };

    /* adds a secondary compare function to the target function (`this` context)
       which is applied in case the first one returns 0 (equal)
       returns a new compare function, which has a `thenBy` method as well */
    var tb = function (y, d) {

        var self = this;
        y = makeCompareFunction(y, d);
        return extend(function (a, b) {

            return self(a, b) || y(a, b);
        });
    };
    return extend;
    /* $lab:coverage:on$ */
})();



/**
 * create id
 *
 * @param  {String} method
 * @param  {String} path
 * @return {String}
 */
utilities.createId = function (method, path) {

    const self = this;
    if (path.indexOf('/') > -1) {
        let items = path.split('/');
        items = items.map(function (item) {
            // replace chars such as '{'
            item = item.replace(/[^\w\s]/gi, '');
            return self.toTitleCase(item);
        });
        path = items.join('');
    } else {
        path = self.toTitleCase(path);
    }
    return method.toLowerCase() + path;
};


/**
 * create toTitleCase
 *
 * @param  {String} word
 * @return {String}
 */
utilities.toTitleCase = function (word){

    return word.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};


/**
 * applies path replacements
 *
 * @param  {String} path
 * @param  {Array} applyTo
 * @param  {Array} options
 * @return {String}
 */
utilities.replaceInPath = function ( path, applyTo, options ){

    options.forEach((option) => {
        if (applyTo.indexOf(option.replaceIn) > -1 || option.replaceIn === 'all') {
            path = path.replace(option.pattern, option.replacement);
        }
    });
    return path;
};
