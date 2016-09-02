'use strict';
const SwaggerParser = require('swagger-parser');

const validate = module.exports = {};



/**
 * validate a JSON swagger document - logFnc pattern function(array,string){}
 *
 * @param  {Object} doc
 * @param  {Object} logFnc
 * @return {Object}
 */
validate.log = function (doc, logFnc) {

    SwaggerParser.validate(doc)
        .then( () => {

            logFnc(['validation', 'info'], 'Yay! The swagger.json output is valid against the specification.');
        })
        .catch( (err) => {

            logFnc(['validation', 'error'], 'OH NO! swagger.json output is invalid. ' + err.message);
        });

};


validate.test = function (doc, next) {

    SwaggerParser.validate(doc)
        .then( () => {

            next(null, true);
        })
        .catch( (err) => {
            //console.log(err)
            next(err, false);
        });

};
