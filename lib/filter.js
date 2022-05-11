const Hoek = require('@hapi/hoek');

const filter = (module.exports = {});

/*
 * Filters routes based on tags
 *
 * Remove routes without the specified tags allow for + and - tag prefixes
 * e.g.: ?&tags=movies,directors,actors
 *         will show routes WITH 'movies' OR 'directors' OR 'actors'
 *
 * e.g.: ?&tags=movies,directors,+actors
 *         will show routes WITH ('movies' OR 'directors')  AND 'actors'
 *
 *  e.g.: ?tags=movies,+directors,-actors
 *         will show routes WITH 'movies' AND 'directors' AND NO 'actors'
 */

/**
 * filters routes based on tags
 *
 * @param  {Array} tags
 * @param  {Array} routes
 * @return {Array}
 */
filter.byTags = function (tags, routes) {
  return routes.filter((route) => {
    if (!route.settings.tags) {
      return false;
    }

    const noPrefixTags = [];

    for (let i = 0; i < tags.length; ++i) {
      let tag;

      switch (tags[i].substring(0, 1)) {
        case '-': // exclude tags that match this case
          tag = tags[i].substring(1);
          if (route.settings.tags.includes(tag)) {
            return false;
          }

          break;
        case '+': // (+) filter out tagged paths that do not have this tag
          tag = tags[i].substring(1);
          if (!route.settings.tags.includes(tag)) {
            return false;
          }

          break;
        default: // no prefix
          noPrefixTags.push(tags[i]);
      }
    }

    return Hoek.intersect(route.settings.tags, noPrefixTags).length > 0;
  });
};

/**
 * filters routes based on function
 *
 * @param  {Function} filterFn
 * @param  {Array} routes
 * @return {Array}
 */
filter.byFunction = function (filterFn, routes) {
  routes = routes.filter((route) => !route.fingerprint.startsWith('/swaggerui/'));
  return routes.filter((route) => route.settings.tags ? filterFn(route.settings.tags) : false);
};
