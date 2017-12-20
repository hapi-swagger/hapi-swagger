const Joi = require('joi');
const customJoi = Joi.extend((joi) => ({
    base: joi.number(),
    name: 'number',
    language: {
        round: 'needs to be a rounded number', // Used below as 'number.round'
        dividable: 'needs to be dividable by {{q}}'
    },
    pre(value, state, options) {

        if (options.convert && this._flags.round) {
            return Math.round(value); // Change the value
        }

        return value; // Keep the value as it was
    },
    /*eslint-disable */
    rules: [
        {
            name: 'round',
            setup(params) {
                this._flags.round = true; // Set a flag for later use
            },
            validate(params, value, state, options) {

                if (value % 1 !== 0) {
                    // Generate an error, state and options need to be passed
                    return this.createError('number.round', { v: value }, state, options);
                }

                return value; // Everything is OK
            }
        },
        {
            name: 'dividable',
            params: {
                q: joi.alternatives([joi.number().required(), joi.func().ref()])
            },
            validate(params, value, state, options) {

                if (value % params.q !== 0) {
                    // Generate an error, state and options need to be passed, q is used in the language
                    return this.createError('number.dividable', { v: value, q: params.q }, state, options);
                }

                return value; // Everything is OK
            }
        }
    ]
    /*eslint-enable */
}));

module.exports = customJoi;
