// defaults settings for plug-in
module.exports = {
    'debug': false,
    'jsonPath': '/swagger.json',
    'documentationPath': '/documentation',
    'documentationRouteTags': [],
    'swaggerUIPath': '/swaggerui/',
    'auth': false,
    'pathPrefixSize': 1,
    'payloadType': 'json',
    'documentationPage': true,
    'swaggerUI': true,
    'jsonEditor': false,
    'expanded': 'list',   //none, list or full
    'lang': 'en',
    'sortTags': 'default',
    'sortEndpoints': 'path',
    'sortPaths': 'unsorted',
    'grouping': 'path',
    'tagsGroupingFilter': (tag) => tag !== 'api',
    'uiCompleteScript': null,
    'xProperties': true,
    'reuseDefinitions': true,
    'definitionPrefix': 'default',
    'deReference': false,
    'validatorUrl': '//online.swagger.io/validator',
    'acceptToProduce': true,  // internal, NOT public
    'pathReplacements': []
};
