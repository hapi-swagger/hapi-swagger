# 9.0.0 Options Reference

## Plugin Options

URLs and plugin
* `schemes`: (array) The transfer protocol of the API ie `['http']`
* `host`: (string) The host (name or IP) serving the API including port if any i.e. `localhost:8080`
* `auth`: (boolean, string or object) defines security strategy to use for plugin resources - default: `false`,
* `cors`: (boolean) whether the swagger.json routes is servered with cors support - default: `false`,

JSON (JSON endpoint needed to create UI)
* `jsonPath`: (string) The path of JSON endpoint at describes the API - default: `/swagger.json`
* `basePath`: (string) The base path from where the API starts i.e. `/v2/` (note, needs to start with `/`) -  default: `/`
* `pathPrefixSize`: (number) Selects what segment of the URL path is used to group endpoints - default: `1`
* `pathReplacements` : (array) methods for modifying path and group names in documentation - default: `[]`
* `info`
  * `title`: (string) The title of the application -  default: `API documentation`
  * `version`: (string) The version number of the API -  default: `0.0.1`
  * `description`: (string) A short description of the application
  * `termsOfService`: (string) A URL to the Terms of Service of the API
  * `contact`
    * `name`: (string) A contact name for the API
    * `url`: (string) A URL pointing to the contact information. MUST be formatted as a URL
    * `email`: (string) A email address of the contact person/organization. MUST be formatted as an email address.
  * `license`
    * `name` (string) The name of the license used for the API
    * `url` (string) The URL to the license used by the API. MUST be formatted as a URL
  * `x-*` (any): any property or object with a key starting with *x-* is included as such in the *info* section
    of the object returned by the JSON endpoint. This allows custom properties to be defined as options and
    copied as such.
*  `tags`: (array) containing array of [Tag Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#tagObject) used to group endpoints in UI. No defaults are provided.
*  `grouping`: (string) how to create grouping of endpoints value either `path` or `tags` - default: `path`
*  `tagsGroupingFilter`: (function) A function used to determine which tags should be used for grouping (when `grouping` is set to `tags`) - default: `(tag) => tag !== 'api'`
*  `securityDefinitions:`: (object) Containing [Security Definitions Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityDefinitionsObject). No defaults are provided.
*  `payloadType`: (string) How payload parameters are displayed `json` or `form` - default: `json`
* `documentationRouteTags`: (string or array) Add hapi tags to internal `hapi-swagger` routes - default: `[]`
*  `consumes`: (array) The mimetypes consumed - default: `['application/json']`
*  `produces`: (array) The mimetypes produced - default: `['application/json']`
*  `xProperties`: Adds JOI data that cannot be use directly by swagger as metadata - default: `true`,
*  `reuseDefinitions`: Reuse of definition models to save space - default: `true`,
*  `definitionPrefix`: Dynamic naming convention. `default` or `useLabel` - default: `default`,
*  `deReference`: Dereferences JSON output - default: `false`,
*  `debug`: Validates the JSON ouput against swagger specification - default: `false`,

UI
* `swaggerUI`: (boolean) Add files that support SwaggerUI. Only removes files if `documentationPage` is also set to false - default: `true`
* `swaggerUIPath`: (string) The path of to all the SwaggerUI resources - default: `/swaggerui/`
* `documentationPage`: (boolean) Add documentation page - default: `true`
* `documentationPath`: (string) The path of the documentation page - default: `/documentation`
* `expanded`: (string) If UI is expanded when opened. `none`, `list` or `full` - default: `list`
* `jsonEditor`: (boolean) If UI should use JSON Editor - default: `false`
* `sortTags`: (string) a sort method for `tags` i.e. groups in UI. `default` or `name`
* `sortEndpoints`: (string) a sort method for endpoints in UI. `path`, `method`, `ordered`
* `lang`: (string) The language of the UI `en`, `es`, `fr`, `it`, `ja`, `pl`, `pt`, `ru`, `tr` or `zh-cn` - default: `en`
* `uiCompleteScript`: (string) A JavaScript string injected into the HTML, called when UI loads - default: `null`
* `validatorUrl`: (string || null) sets the external validating URL Can swtich off by setting to `null`


## Route Options
*  `payloadType`: (string) How payload parameters are displayed `json` or `form` - default: `json`
*  `responses`: (object) a collection of example responses for each HTTP statuses
*  `consumes`: (array) The mimetypes consumed - default: `['application/json']`
*  `produces`: (array) The mimetypes produced - default: `['application/json']`
*  `validate`
   *  `params`: (JOI object) allows you to `param` route documentation outside of HAPI validation
   *  `query`: (JOI object) allows you to `query` route documentation outside of HAPI validation
   *  `headers`: (JOI object) allows you to `headers` route documentation outside of HAPI validation
   *  `payload`: (JOI object) allows you to `payload` route documentation outside of HAPI validation
*  `security`: Hoek.reach(routeOptions, 'security') || null,
*  `order`: (int) The order in which endpoints are displayed, works with options.sortEndpoints = 'ordered'
*  `deprecated`: (boolean) Whether a endpoint has been deprecated - default: false




# Plugin options example
The plugin level options are added as you register the `hapi-swagger` plugin.

```Javascript
const options = {
    'info': {
        'title': 'Test API Documentation',
        'version': '5.14.3',
        'contact': {
            'name': 'Glenn Jones',
            'email': 'glenn@example.com'
    },
    'schemes': ['https'],
    'host': 'example.com'
};

await server.register([
    Inert,
    Vision,
    {
        plugin: HapiSwagger,
        options: options
    }
]);

try {
    await server.start( (err) => {
    console.log('Server running at:', server.info.uri);
} catch(err) {
    console.log(err);
}
server.route(Routes);
```

# Route options example
The route level options are always placed within the `plugins.hapi-swagger` object under `config`. These options are
only assigned to the route they are apply to.
```Javascript
{
    method: 'PUT',
    path: '/store/{id}',
    config: {
        handler: handlers.storeUpdate,
        plugins: {
            'hapi-swagger': {
                responses: {
                    '400': {
                        'description': 'BadRequest'
                    }
                },
                payloadType: 'form'
            }
        },
        tags: ['api'],
        validate: {
            payload: {
                a: Joi.number().required().description('the first number')
            }
        }
    }
}
```
