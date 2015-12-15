'use strict';
var Hoek = require('hoek');

var utilities = module.exports = {};


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
