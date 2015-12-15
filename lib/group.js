'use strict';
const group = module.exports = {};


/**
 * groups api endpoint by url path segments
 *   - adds group property to route
 *   - returns array of group names
 *
 * @param  {Object} settings
 * @param  {Array} routes
 * @return {Array}
 */
group.byPath = function (settings, routes) {

    let out = [];

    routes.forEach( (route) => {

        if (route.settings.tags && route.settings.tags.indexOf('api') > -1) {
            let prefix = group.getNameByPath(settings, route.path);
            // append tag reference to route
            route.group = [prefix];
            if (out.indexOf(prefix) === -1) {
                out.push(prefix);
            }
        }
    });
    return out;
};


/**
 * get a group name from url path segments
 *
 * @param  {Object} settings
 * @param  {String} path
 * @return {Array}
 */
group.getNameByPath = function (settings, path) {

    let i = 0;
    let pathHead = [];
    let parts = path.split('/');

    while (parts.length > 0) {
        let item = parts.shift();
        if (item !== '') {
            pathHead.push(item);
            i++;
        }
        if (i >= settings.pathPrefixSize) {
            break;
        }
    }
    return pathHead.join('/');
};
