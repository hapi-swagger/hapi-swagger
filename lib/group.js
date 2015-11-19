/*
 * Groups routes by URL path segments
 */


'use strict';
var group = module.exports = {};	


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
    //console.log(settings.pathPrefixSize)
    var out = [],
        i = routes.length,
        x = 0,
        route,
        parts,
        prefix;        
  
    while (x < i) {
        route = routes[x];
        if (route.settings.tags && route.settings.tags.indexOf('api') > -1) {
            parts = route.path.split('/');
            prefix = group.getNameByPath(settings, route.path);
            // append tag reference to route
            route.group = [prefix]
            if (out.indexOf(prefix) === -1) {
                out.push(prefix);
            }

        }
        x++;
    }
    return out;
}



/**
 * get a group name from url path segments
 *
 * @param  {Object} settings
 * @param  {String} path
 * @return {Array}
 */
group.getNameByPath = function (settings, path) {
    var i = 0,
        pathHead = [],
        prefix,
        parts;
        
    parts = path.split('/');
    while (parts.length > 0) {
        var item = parts.shift();
        if (item !== '') {
            pathHead.push(item);
            // only count when it's a path element (and not the initial /)
            i++;
        }
        //console.log(settings.pathPrefixSize)
        if (i >= settings.pathPrefixSize) {
            break;
        }
    }
    prefix = pathHead.join('/');
    return prefix;
};