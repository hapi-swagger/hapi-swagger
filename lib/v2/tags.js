const Joi = require('joi');

const tags = (module.exports = {});

/**
 * schema for tags
 *
 */
tags.schema = Joi.array().items(
  Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    externalDocs: Joi.object({
      description: Joi.string(),
      url: Joi.string().uri()
    }),
  })
    .label('Tag')
    .optional()
    .pattern(/^x-/, Joi.any())
);

/**
 * build the swagger tag section
 *
 * @param  {Object} settings
 * @return {Object}
 */
tags.build = function(settings) {
  let out = [];

  if (settings.tags) {
    Joi.assert(settings.tags, tags.schema);
    out = settings.tags;
  }

  return out;
};
