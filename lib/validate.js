'use strict';
const SwaggerParser = require('swagger-parser');

const validate = module.exports = {};



/**
 * validate a JSON swagger document and log output
 * logFnc pattern function(array,string){}
 *
 * @param  {Object} doc
 * @param  {Object} logFnc
 * @return {Object}
 */
validate.log = function (doc, logFnc) {

    SwaggerParser.validate(doc, (err) => {

        // use err.message so thrown error object is not passed into testing
        if (err) {
            logFnc(['validation', 'error'], 'FAILED - ' + err.message);
        } else {
            logFnc(['validation', 'info'], 'PASSED - The swagger.json validation passed.');
        }
    });
};


/**
 * validate a JSON swagger document
 *
 * @param  {Object} doc
 * @param  {Object} next
 * @return {Object}
 */
validate.test = function (doc, next) {

    SwaggerParser.validate(doc, (err) => {
        // use err.message so thrown error object is not passed into testing
        if (err) {
            next(err.message, false);
        } else {
            next(null, true);
        }
    });

};
