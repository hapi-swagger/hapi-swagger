const { resolve } = require('path');

// defaults settings for plug-in
module.exports = {
  debug: false,
  jsonPath: '/swagger.json',
  jsonRoutePath: '/swagger.json',
  documentationPath: '/documentation',
  documentationRouteTags: [],
  documentationRoutePlugins: {},
  templates: resolve(__dirname, '..', 'templates'),
  swaggerUIPath: '/swaggerui/',
  routesBasePath: '/swaggerui/',
  auth: false,
  pathPrefixSize: 1,
  payloadType: 'json',
  documentationPage: true,
  swaggerUI: true,
  expanded: 'list', //none, list or full
  sortTags: 'alpha',
  sortEndpoints: 'alpha',
  sortPaths: 'unsorted',
  grouping: 'path',
  tagsGroupingFilter: tag => tag !== 'api',
  uiCompleteScript: null,
  xProperties: true,
  reuseDefinitions: true,
  definitionPrefix: 'default',
  deReference: false,
  validatorUrl: '//online.swagger.io/validator',
  acceptToProduce: true, // internal, NOT public
  pathReplacements: [],
  tryItOutEnabled: false,
};
