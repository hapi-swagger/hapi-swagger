const Joi = require('@hapi/joi');
const customJoi = Joi.extend(joi => ({
  type: 'number',
  base: joi.number(),
  messages: {
    round: 'needs to be a rounded number', // Used below as 'number.round'
    dividable: 'needs to be dividable by {{q}}'
  },
  coerce(value, helpers) {

    // Only called when prefs.convert is true

    if (helpers.schema.$_getRule('round')) {
      return { value: Math.round(value) };
    }
  },
  /*eslint-disable */
  rules: {
    round: {
      convert: true,              // Dual rule: converts or validates
      method() {

        return this.$_addRule('round');
      },
      validate(value, helpers, args, options) {

        // Only called when prefs.convert is false (due to rule convert option)

        if (value % 1 !== 0) {
          return helpers.error('number.round');
        }
      }
    },
    dividable: {
      multi: true,                // Rule supports multiple invocations
      method(q) {

        return this.$_addRule({ name: 'dividable', args: { q } });
      },
      args: [
        {
          name: 'q',
          ref: true,
          assert: (value) => typeof value === 'number' && !isNaN(value),
          message: 'must be a number'
        }
      ],
      validate(value, helpers, args, options) {

        if (value % args.q === 0) {
          return value;       // Value is valid
        }

        return helpers.error('number.dividable', { q: args.q });
      }
    }
  }
  /*eslint-enable */
}))

module.exports = customJoi;
