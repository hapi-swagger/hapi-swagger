const Utilities = require('../lib/utilities');

const group = (module.exports = {});

/**
 * append group property with name created from url path segments
 *   - adds group property to route
 *   - returns array of group names
 *
 * @param  {Int} pathPrefixSize
 * @param  {String} basePath
 * @param  {Array} routes
 * @param  {Array} pathReplacements
 * @return {Array}
 */
group.appendGroupByPath = function(pathPrefixSize, basePath, routes, pathReplacements) {
  const out = [];

  routes.forEach(route => {
    const prefix = group.getNameByPath(pathPrefixSize, basePath, route.path, pathReplacements);
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
 * @param  {Array} pathReplacements
 * @return {Array}
 */
group.getNameByPath = function(pathPrefixSize, basePath, path, pathReplacements) {
  if (pathReplacements) {
    path = Utilities.replaceInPath(path, ['groups'], pathReplacements);
  }

  let i = 0;
  const pathHead = [];
  const parts = path.split('/');

  while (parts.length > 0) {
    const item = parts.shift();

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

    if (Utilities.startsWith(name, '/')) {
      name = name.replace('/', '');
    }
  }

  return name;
};
