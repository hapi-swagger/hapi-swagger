'use strict';
const Utilities = require('../lib/utilities');

const sort = module.exports = {};



/**
 * sort routes by path then method
 *
 * @param  {Array} routes
 * @return {Array}
 */
sort.byPathMethod = function (routes) {

    routes.sort(
        Utilities.firstBy('path').thenBy('method')
    );
    return routes;
};



