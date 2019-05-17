const SwaggerParser = require('swagger-parser');

const validate = (module.exports = {});

/**
 * validate a JSON swagger document and log output
 * logFnc pattern function(array,string){}
 *
 * @param  {Object} doc
 * @param  {Object} logFnc
 * @return {Object}
 */
validate.log = async (doc, logFnc) => {
  try {
    await SwaggerParser.validate(doc);
    logFnc(['validation', 'info'], 'PASSED - The swagger.json validation passed.');
    return true;
  } catch (err) {
    logFnc(['validation', 'error'], `FAILED - ${err.message}`);
    return false;
  }
};

/**
 * validate a JSON swagger document
 *
 * @param  {Object} doc
 * @param  {Object} next
 * @return {Object}
 */
validate.test = async doc => {
  try {
    await SwaggerParser.validate(doc);
    return true;
  } catch (err) {
    return false;
  }
};
