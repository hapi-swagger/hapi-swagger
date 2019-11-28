# Options

## Plugin Options

### URLs and plugin

-   `schemes`: (array) The transfer protocol of the API ie `['http']`
-   `host`: (string) The host (name or IP) serving the API including port if any i.e. `localhost:8080`
-   `auth`: (boolean, string or object) defines security strategy to use for plugin resources - default: `false`,
-   `cors`: (boolean) whether the swagger.json routes is severed with cors support - default: `false`,

#### JSON (JSON endpoint needed to create UI)

-   `jsonPath`: (string) The path of JSON endpoint at describes the API - default: `/swagger.json`
-   `basePath`: (string) The base path from where the API starts i.e. `/v2/` (note, needs to start with `/`) - default: `/`
-   `pathPrefixSize`: (number) Selects what segment of the URL path is used to group endpoints - default: `1`
-   `pathReplacements` : (array) methods for modifying path and group names in documentation - default: `[]`
-   `info`
    -   `title`: (string) The title of the application - default: `API documentation`
    -   `version`: (string) The version number of the API - default: `0.0.1`
    -   `description`: (string) A short description of the application
    -   `termsOfService`: (string) A URL to the Terms of Service of the API
    -   `contact`
        -   `name`: (string) A contact name for the API
        -   `url`: (string) A URL pointing to the contact information. MUST be formatted as a URL
        -   `email`: (string) A email address of the contact person/organization. MUST be formatted as an email address.
    -   `license`
        -   `name` (string) The name of the license used for the API
        -   `url` (string) The URL to the license used by the API. MUST be formatted as a URL
    -   `x-*` (any): any property or object with a key starting with `x-*` is included as such in the `info` section of the object returned by the JSON endpoint. This allows custom properties to be defined as options and copied as such.
-   `tags`: (array) containing array of [Tag Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#tagObject) used to group endpoints in UI. No defaults are provided.
-   `routeTag`: (string) Tag used by `hapi-swagger` to collect all the route definitions that should be included in the OpenAPI swagger defintion - default: `api`
-   `grouping`: (string) how to create grouping of endpoints value either `path` or `tags` - default: `path`
-   `tagsGroupingFilter`: (function) A function used to determine which tags should be used for grouping (when `grouping` is set to `tags`) - default: `(tag) => tag !== 'api'`
-   `securityDefinitions:`: (object) Containing [Security Definitions Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityDefinitionsObject). No defaults are provided.
-   `payloadType`: (string) How payload parameters are displayed `json` or `form` - default: `json`
-   `documentationRouteTags`: (string or array) Add hapi tags to internal `hapi-swagger` routes - default: `[]`
-   `documentationRoutePlugins`: (object) Add hapi plugins to internal `hapi-swagger` routes - default: `{}`
-   `consumes`: (array) The mime types consumed - default: `['application/json']`
-   `produces`: (array) The mime types produced - default: `['application/json']`
-   `xProperties`: Adds JOI data that cannot be use directly by swagger as metadata - default: `true`
-   `reuseDefinitions`: Reuse of definition models to save space - default: `true`
-   `definitionPrefix`: Dynamic naming convention. `default` or `useLabel` - default: `default`
-   `deReference`: Dereferences JSON output - default: `false`,
-   `debug`: Validates the JSON output against swagger specification - default: `false`
-   `x-*` (any): any property or object with a key starting with `x-*` is included in the swagger definition (similar to `x-*` options in the `info` object).
-   `oauthOptions`: [TODO](https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/oauth2.md)

### UI

> @see [swagger-ui options](https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md) as reference.

-   `swaggerUI`: (boolean) Add files that support SwaggerUI. Only removes files if `documentationPage` is also set to false - default: `true`
-   `swaggerUIPath`: (string) The path of to all the SwaggerUI resources - default: `/swaggerui/`
-   `documentationPage`: (boolean) Add documentation page - default: `true`
-   `documentationPath`: (string) The path of the documentation page - default: `/documentation`
-   `templates`: (string) The directory path used by `hapi-swagger` and `@hapi/vision` to resolve and load the templates to render `swagger-ui` interface. The directory must contain `index.html` and `debug.html` templates. Default is `templates` directory in this package.
-   `expanded`: (string) If UI is expanded when opened. `none`, `list` or `full` - default: `list`
-   `sortTags`: (string) a sort method for `tags` i.e. groups in UI. `alpha`
    -   `alpha`: sort by paths alphanumerically
-   `sortEndpoints`: (string) a sort method for endpoints in UI. `alpha`, `method`, `ordered`. Default is `alpha`.
    -   `alpha`: sort by paths alphanumerically
    -   `method`: sort by HTTP method
    -   `ordered`: sort by `order` value of the `hapi-swagger` plugin options of the route.
-   `uiCompleteScript`: (string) A JavaScript string injected into the HTML, called when UI loads - default: `null`
-   `validatorUrl`: (string || null) sets the external validating URL Can switch off by setting to `null`

## Plugin Specific Route Options

-   `payloadType`: (string) How payload parameters are displayed `json` or `form` - default: `json`
-   `responses`: (object) a collection of example responses for each HTTP statuses
-   `consumes`: (array) The mime types consumed - default: `['application/json']`
-   `produces`: (array) The mime types produced - default: `['application/json']`
-   `security`: (object) Containing [Security Definitions Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityDefinitionsObject). No defaults are provided.
-   `order`: (int) The order in which endpoints are displayed, works with `options.sortEndpoints === ordered`
-   `x-*` (any): any property or object with a key starting with `x-*` is included in the swagger definition (similar to `x-*` options in the `info` object).
-   `deprecated`: (boolean) Whether a endpoint has been deprecated - default: false

## Route Options

-   `validate`
    -   `params`: (JOI object) allows you to `param` route documentation outside of Hapi validation
    -   `query`: (JOI object) allows you to `query` route documentation outside of Hapi validation
    -   `headers`: (JOI object) allows you to `headers` route documentation outside of Hapi validation
    -   `payload`: (JOI object) allows you to `payload` route documentation outside of Hapi validation

## Examples

### Plugins Example

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

### Route Example

The route level options are always placed within the `plugins.hapi-swagger` object under `config`. These options are
only assigned to the route they are apply to.

```Javascript
{
    method: 'PUT',
    path: '/store/{id}',
    options: {
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
            payload: Joi.object({
                a: Joi.number().required().description('the first number')
            })
        }
    }
}
```
