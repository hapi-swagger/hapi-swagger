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
filter.byTags = function(tags, routes) {
  let tag;

  return routes.filter(route => {
    let exit;
    for (let i = 0; i < tags.length; i++) {
      switch (tags[i].substring(0, 1)) {
        case '-': // exclude tags that match this case
          tag = tags[i].substring(1, tags[i].length);
          if (Hoek.intersect(route.settings.tags, [tag]).length > 0) {
            exit = true;
          }
          break;
        case '+': // (+) filter out tagged paths that do not have this tag!
          tag = tags[i].substring(1, tags[i].length);
          if (Hoek.intersect(route.settings.tags, [tag]).length === 0) {
            exit = true;
          }
          break;
      }
    }

    // if we have reason to exit, then do so!
    if (exit === true) {
      return false;
    }

    // default behavior for tags is additive
    if (Hoek.intersect(route.settings.tags, tags).length > 0) {
      return true;
    }

    // fallback or no tag defined
    return false;
  });
};
