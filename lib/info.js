const Hoek = require('@hapi/hoek');
const Joi = require('joi');

const info = (module.exports = {});

/**
 * default data for info
 */
info.defaults = {
  title: 'API documentation',
  version: '0.0.1'
};

/**
 * schema for info
 */
info.schema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  termsOfService: Joi.string(),
  contact: Joi.object({
    name: Joi.string(),
    url: Joi.string().uri(),
    email: Joi.string().email()
  }),
  license: Joi.object({
    name: Joi.string(),
    url: Joi.string().uri()
  }),
  version: Joi.string().required()
}).pattern(/^x-/, Joi.any());

/**
 * build the swagger info section
 *
 * @param  {Object} options
 * @return {Object}
 */
info.build = function(options) {
  var out = options.info ? Hoek.applyToDefaults(info.defaults, options.info) : info.defaults;
  Joi.assert(out, info.schema);
  return out;
};
