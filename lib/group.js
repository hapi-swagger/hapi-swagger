'use strict';
const Utilities = require('../lib/utilities');
const group = module.exports = {};



/**
 * append group property with name created from url path segments
 *   - adds group property to route
 *   - returns array of group names
 *
 * @param  {Int} pathPrefixSize
 * @param  {String} basePath
 * @param  {Array} routes
 * @param  {Boolean} suppressVersionFromBasePath
 * @return {Array}
 */
group.appendGroupByPath = function (pathPrefixSize, basePath, routes, suppressVersionFromBasePath) {

    let out = [];

    routes.forEach( (route) => {
        let prefix = group.getNameByPath(pathPrefixSize, basePath, route.path, suppressVersionFromBasePath);
        // append tag reference to route
        route.group = [prefix];
        if (out.indexOf(prefix) === -1) {
            out.push(prefix);
        }
    });

    return out;
};


/**
 * get a group name from url path segments
 *
 * @param  {Int} pathPrefixSize
 * @param  {String} basePath
 * @param  {String} path
 * @param  {Boolean} suppressVersionFromBasePath
 * @return {Array}
 */
group.getNameByPath = function (pathPrefixSize, basePath, path, suppressVersionFromBasePath) {

    let i = 0;
    let pathHead = [];
    let parts = path.split('/');

    while (parts.length > 0) {
        let item = parts.shift();

        if (item !== '') {
            pathHead.push(item);
            i++;
        }
        if (i >= pathPrefixSize) {
            break;
        }
    }

    let name = pathHead.join('/');

    if (basePath !== '/' && Utilities.startsWith('/' + name, basePath)) {
        name = ('/' + name).replace(basePath, '');
    }
    
    if (suppressVersionFromBasePath) {
         name = name.replace(/v([0-9]+)\//, '');
    }

    if (Utilities.startsWith(name, '/')) {
        name = name.replace('/', '');
    }

    return name;
};
