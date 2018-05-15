# 9.0.0 Usage Guide

### Content
* [JSON body](#json-body)
* [Form body](#form-body)
* [Params query and headers](#params-query-and-headers)
* [Naming](#naming)
* [Grouping endpoints by path or tags](#grouping-endpoints-by-path-or-tags)
* [Extending group information with tag objects](#extending-group-information-with-tag-objects)
* [Ordering the endpoints within groups](#ordering-the-endpoints-within-groups)
* [Rewriting paths and groupings](#rewriting-paths-and-groupings)
* [Response Object](#response-object)
* [Status Codes](#status-codes)
* [Caching](#caching)
* [File upload](#file-upload)
* [Headers and .unknown()](#headers-and-unknown)
* [Additional HAPI data using x-*](#additional-hapi-data-using-x-)
* [JSON without UI](#json-without-ui)
* [Simplifying the JSON](#simplifying-the-json)
* [Debugging](#debugging)
* [Features from HAPI that cannot be ported to Swagger](#features-from-hapi-that-cannot-be-ported-to-swagger)
* [Known issues with `jsonEditor`](#known-issues-with-jsoneditor)
* [Adding the interface into your own custom page](#adding-the-interface-into-your-own-custom-page)

### Links
* [Example code in project](#example-code-in-project)
* [External example projects](#external-example-projects)


# JSON body
The most common API endpoint with HAPI.js is one that POST's a JSON body.
```Javascript
{
    method: 'POST',
    path: '/items',
    config: {
        handler: (request, reply) => { reply('OK'); },
        tags: ['api'],
        validate: {
            payload: Joi.object({
                a: Joi.number(),
                b: Joi.number()
            })
        }
    }
}
```

# Form body
If you wish to have hapi-swagger display a interface to POST data in `form-urlencoded` format add the route option `payloadType: 'form'`.
```Javascript
{
    method: 'POST',
    path: '/items',
    config: {
        handler: (request, reply) => { reply('OK'); },
        tags: ['api'],
        plugins: {
            'hapi-swagger': {
                payloadType: 'form'
            }
        },
        validate: {
            payload: Joi.object({
                a: Joi.number(),
                b: Joi.number()
            })
        }
    }
}
```

# Params query and headers
The plugin will take either a JavaScript or JOI object for `params` `query` and `headers` and build the correct interface.

```Javascript
{
    method: 'GET',
    path: '/items/{pageNo}',
    config: {
        handler: (request, reply) => { reply('OK'); },
        tags: ['api'],
        validate: {
            params: {
                pageNo: Joi.number()
            },
            query: {
                search: Joi.string()
            },
            headers: Joi.object({
                'authorization': Joi.string().required()
            }).unknown()
        }

    }
}
```
There are a number of restriction for what types can be used for `params`, `query` and `headers`. The standard is a
object with properties which are JOI objects. In example above you can see examples of native JavaScript objects for
`params` and `query`. The `headers` uses a `Joi.object()` which is useful if you want to chain other JOI functions
such as `unknown()`.

Trying to use more complex types in `params`, `query` and `headers` such as `Joi.array()` or complex parent child
`Joi.object()` structures may not work, in these cases pass the data in a JSON body object.


# Naming
There are times when you may wish to name a object so that its label in the Swagger UI make more sense to humans.
This is most common when you have endpoints which process JSON objects. To label a object wrap it as a JOI object
and chain the `label` function as below. __You need to give different structures their own unique name.__
```Javascript
validate: {
    payload: Joi.object({
        a: Joi.number(),
        b: Joi.number()
    }).label('Sum')
}
```
__NOTE: the plugin reuses "definition models" these describe each JSON object use by an API i.e. a "user". This feature
was added to reduce the size of the JSON. The reuse of models can cause names to be reused as well. Please switch
`options.reuseDefinitions` to `false` if you are naming your JOI objects. By default objects are named in a "Model #"
 format. To use the `label`, specify `options.definitionPrefix` as `useLabel`.__



# Grouping endpoints by path or tags
The plugin will by default group your endpoints using information in the path. So `\users\{id}` and `\users\{id}\history` would be
group together under the title `users`. How the path based grouping works is controlled by using the `options.basePath`
and `options.pathPrefixSize` properties.

If you wish to create groups of your own making you can use the `options.grouping: tags` property. You need also need to define
custom tags for each route as below.


```Javascript
let options = {
    info: {
        'title': 'Test API Documentation',
        'version': Pack.version,
    },
    options.grouping: 'tags'
};

let routes = [{
    method: 'GET',
    path: '/petstore/{id}',
    config: {
        handler: (request, reply) => { reply({ ok: true }); },
        description: 'Array properties',
        tags: ['api', 'petstore']
    }
}, {
    method: 'GET',
    path: '/store/{id}/address',
    config: {
        handler: (request, reply) => { reply({ ok: true }); },
        description: 'Array properties',
        tags: ['api', 'petstore']
    }
}]
```
Both the routes above would be grouped in `petstore`. This is because the second tag in each route is set to `petstore` and
the `options.grouping` is set to `tags`



# Extending group information with tag objects
Swagger provides a tag object which allows you extend the information provide for a group of endpoints in the UI.
You must match the `name` in the `options.tags` array items with the `path` fragmenets or `tags` used to create groups.

```Javascript
let options = {
    info: {
        'title': 'Test API Documentation',
        'version': Pack.version,
    },
    tags: [{
        'name': 'users',
        'description': 'Users data'
    },{
        'name': 'store',
        'description': 'Storing a sum',
        'externalDocs': {
            'description': 'Find out more about storage',
            'url': 'http://example.org'
        }
    }, {
        'name': 'sum',
        'description': 'API of sums',
        'externalDocs': {
            'description': 'Find out more about sums',
            'url': 'http://example.org'
        }
    }]
};
```
The groups are order in the same sequence you add them to the `tags` array in the plug-in options. You can enforce
the order by name A-Z by switching the plugin `options.sortTags = 'name'`.


# Ordering the endpoints within groups
The endpoints within the UI groups can be order with the property `options.sortEndpoints`, by default the are ordered
A-Z using the `path` information. Can also order them by `method`. Finally if you wish to enforce you own order then
you added route option `order` to each endpoint and switch the plugin options to `options.sortEndpoints = 'ordered'`.
```Javascript
{
    method: 'PUT',
    path: '/test',
    config: {
        description: 'Add',
        tags: [
            'api'
        ],
        plugins: {
            'hapi-swagger': {
                order: 2
            }
        }
    }
}
```



# Rewriting paths and groupings
Ther are two ways to change to do this:
There are time you may wish to modify how groups and endpoint paths are displayed within the documentation.

### Option 1 `basePath` and `pathPrefixSize`
You can use the plugin options `basePath` and `pathPrefixSize` to trim what path information is shown in the documentation.
This will not change the API endpoint URL only the path information in the documentation.

```
options: {
    basePath: '/v1',
    pathPrefixSize: 2
}
```
The `pathPrefixSize` determines how many path segments to remove. The number counts the `/` from the host part of the URL.


### Option 2 `pathReplacements`
The plugin option `pathReplacements` is more powerful, but still only changes the path information shown in the documentation.
It allows you to use regex and can also change group titles.

Example of removing version numbers from both paths and groups ie `v2` or `v3`
```
 pathReplacements: [{
    replaceIn: 'all',
    pattern: /v([0-9]+)\//,
    replacement: ''
}]
```

* `replaceIn` (string) defines what to alter, can be:  'groups', 'endpoints' or 'all'
* `pattern` (regex) patten for matching
* `replacement` (string) replacement string

There is a example of this feature  [`dot-grouping.js`](examples/dot-grouping.js) in the examples directory.



# Response Object
HAPI allow you to define a response object for an API endpoint. The response object is used by HAPI to both validate
and describe the output of an API. It uses the same JOI validation objects to describe the input parameters. The
plugin turns these object into visual description and examples in the Swagger UI.

An very simple example of the use of the response object:
```Javascript
const responseModel = Joi.object({
    equals: Joi.number(),
}).label('Result');
```
within you route object ...
```Javascript
config: {
    handler: handlers.add,
    description: 'Add',
    tags: ['api'],
    notes: ['Adds together two numbers and return the result'],
    validate: {
        params: {
            a: Joi.number()
                .required()
                .description('the first number'),

            b: Joi.number()
                .required()
                .description('the second number')
        }
    },
    response: {schema: responseModel}
}
```

A working demo of more complex uses of response object can be found in the [be-more-hapi](https://github.com/glennjones/be-more-hapi) project.



# Status Codes
You can add HTTP status codes to each of the endpoints. As HAPI routes does not have a property for response status codes
it is added as a plugin configuration. The status codes need to be added as an array of objects with an error
code and description. The `description` is required.  The schema is optional, and unlike the example above, the schema object does not validate the API response.

```Javascript
config: {
    handler: handlers.add,
    description: 'Add',
    tags: ['api'],
    notes: ['Adds together two numbers and return the result'],
    plugins: {
		'hapi-swagger': {
			responses: {
        		'200': {
                    'description': 'Success',
                    'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                },
        		'400': {'description': 'Bad Request'}
		    }
		},
    validate: {
        params: {
            a: Joi.number()
                .required()
                .description('the first number'),

            b: Joi.number()
                .required()
                .description('the second number')
        }
    }
}
```


# Caching
It can take some time to create the `swagger.json` data if your server has many complex routes. So `hapi-swagger`
can cache its `swagger.json` data. The cache options are those of HAPI
```
options.cache: {
    expiresIn: 24 * 60 * 60 * 1000
}
```
or
```
options.cache = {
    expiresAt: '23:59'
}
```

* `expiresIn` - relative expiration expressed in milliseconds since the item was saved in the cache. Cannot be used together with `expiresAt`.
* `expiresAt` - time of day expressed in 24h notation using the 'HH:MM' format, at which point all cache records expire. Uses local time. Cannot be used together with `expiresIn`.

__NOTE: The plugin has a number of internal caching features which do help its speed, but this options caches
the whole JSON output.__



# File upload
The plug-in has basic support for file uploads into your API's. Below is an example of a route with a file upload,
the three important elements are:

* `payloadType: 'form'` in the plugins section creates a form for upload
* `.meta({ swaggerType: 'file' })` add to the payload property you wish to be file upload
* `payload` configuration how HAPI will process file
```Javascript
{
    method: 'POST',
    path: '/store/file/',
    config: {
        handler: handlers.storeAddFile,
        plugins: {
            'hapi-swagger': {
                payloadType: 'form'
            }
        },
        tags: ['api'],
        validate: {
            payload: {
                file: Joi.any()
                    .meta({ swaggerType: 'file' })
                    .description('json file')
            }
        },
        payload: {
            maxBytes: 1048576,
            parse: true,
            output: 'stream'
        },
        response: {schema : sumModel}
}
```
The  https://github.com/glennjones/be-more-hapi project has an example of file upload with the handler
function dealing with validation, such as filetype and schema validation.




# Default values and examples
You can add both default values and examples to your JOI objects which are displayed within the Swagger interface.
Defaults are turned into pre-fill values, either in the JSON of a payload or in the text inputs of forms.

```Javascript
validate: {
    payload: Joi.object({
        a: Joi.number().default('10'),
        b: Joi.nunber().default('15')
    }).label('Sum')
}
```

Examples are only shown in the JSON objects and are not used in the text inputs of forms. This is a limitations of Swagger.
```Javascript
validate: {
    payload: Joi.object({
        a: Joi.number().example('10'),
        b: Joi.nunber().example('15')
    }).label('Sum')
}
```



# Headers and .unknown()
A common issue with the use of headers is that you may only want to validate some of the headers sent in a request and
you are not concerned about other headers that maybe sent also. You can use JOI .unknown() to allow any all other
headers to be sent without validation errors.
```Javascript
validate: {
    params: {
        a: Joi.number()
            .required()
            .description('the first number'),

        b: Joi.number()
            .required()
            .description('the second number')
    },
    headers: Joi.object({
         'authorization': Joi.string().required()
    }).unknown()
}
```


# Additional HAPI data using `x-*`
The OpenAPI spec allows for the addition of new properties and structures as long as they their name start with `x-`.
Where possible I have mapped many of Hapi/Joi properties into the swagger.json file.

This includes `Joi.alternatives()` where `try(...)` defines more than one possible structure. The inclusion of
alternatives model means the the swagger.json may also contain `x-alt-definitions` object to store
alternatives models.


# JSON without UI
If you wish just to used `swagger.json` endpoint without the automatically generated documentation page simply set `options.documentationPage` to `false`.
You can still create a custom page and make use of the SwaggerUI files.

If you wish only to the JSON output of the plugin for example with `swagger-codegen` and then set both  `documentationPage` and `swaggerUI` set to false:
```
options: {
    documentationPage: false,
    swaggerUI: false
}
```
With the both `documentationPage` and `swaggerUI` set to false you do not need to load `Inert` and `Vision` plugins to use `hapi-swagger`.


# Simplifying the JSON
The JSON output for OpenAPI(Swagger) is based on the JSONSchema standard which allows for the internal referencing of object
structures using `$ref`. If you wish to simplify the JSON you can use plugin option `options.deReference = true`. This can
be useful if your are using codegen tools against the JSON


# Debugging
The plugin can validate its output against the OpenAPI(Swagger) specification. You can to this by setting the plugin option `options.debug` to `true`.
The debug output is logged into the HAPI server object. You can view the logs by either install the `Good` plugin or by using `server.on`.

There is a small example of the [`debug`](examples/debug.js) feature in the examples directory.


# Features from HAPI that cannot be ported to Swagger
Not all the flexibility of HAPI and JOI can to ported over to the Swagger schema. Below is a list of the most common asked for features that cannot be ported.

* __`Joi.extend()`__ Only works if you are extending a `base` type such as `number` or `string`
* __`Joi.lazy()`__ This new `JOI` feature needs more research to see if its possible to visual describe recursive objects before its supported.
* __`Joi.alternatives()`__  This allows parameters to be more than one type. i.e. string or int. Swagger does not yet support this because of a number codegen tools using swagger build to typesafe languages. This __maybe__ added to the next version of OpenAPI spec. (Experimental support allow for the first of any options to be displayed)
* __`Joi.forbidden()`__ There is only limited support `.forbidden()` with `.alternatives()`
* __`array.ordered(type)`__ This allows for different typed items within an array. i.e. string or int.
* __`{name*}`__ The path parameters with the `*` char are not supported, either is the `{name*3}` the pattern. This will mostly likely be added to the next version of OpenAPI spec.
* __`.allow( null )`__  The current Swagger spec does not support `null`. This __maybe__ added to the next version of OpenAPI spec.
* __`payload: function (value, options, next) {next(null, value);}`__  The use of custom functions to validate pramaters is not support beyond replacing them with an emtpy model call "Hidden Model".
* __`Joi.date().format('yy-mm-dd')` __ The use of a `moment` pattern to format a date cannot be reproduced in Swagger


# Known issues with `jsonEditor`
The `jsonEditor` is a new option in the SwaggerUI. It can provide a much enchanced UI, but I have found a few issues where it does not render correctly and can stop the rest of the UI from displaying.
* Starting a JOI schema as an `Joi.array()` for a `payload` or  `response` object can cause the UI to break with the browser JavaScript error message `Uncaught TypeError: Cannot read property 'required' of undefined`.
* If you wish to switch off dropdown menus for a given propty this can be achieved by adding chaining `.meta()` option to a JOI property i.e. `Joi.number().integer().positive().allow(0).meta({disableDropdown: true})`



# Adding the interface into your own custom page
The plugin adds all the resources needed to build the interface into your any page in your project. All you need
to do is add some javascript into the header of a web page and add two elements into the HTML where you wish it
to render. The example [be-more-hapi](https://github.com/glennjones/be-more-hapi) project makes use of a custom
page where the interface is used with other elements.


### Adding the javascript

The all the files in the URLs below are added by the plugin, but you must server the custom page as template using `reply.view()`.

```
<link rel="icon" type="image/png" href="{{hapiSwagger.swaggerUIPath}}images/favicon-32x32.png" sizes="32x32" />
<link rel="icon" type="image/png" href="{{hapiSwagger.swaggerUIPath}}images/favicon-16x16.png" sizes="16x16" />
<link href='{{hapiSwagger.swaggerUIPath}}css/typography.css' media='screen' rel='stylesheet' type='text/css' />
<link href='{{hapiSwagger.swaggerUIPath}}css/reset.css' media='screen' rel='stylesheet' type='text/css' />
<link href='{{hapiSwagger.swaggerUIPath}}css/screen.css' media='screen' rel='stylesheet' type='text/css' />
<link href='{{hapiSwagger.swaggerUIPath}}css/reset.css' media='print' rel='stylesheet' type='text/css' />
<link href='{{hapiSwagger.swaggerUIPath}}css/print.css' media='print' rel='stylesheet' type='text/css' />
<script src='{{hapiSwagger.swaggerUIPath}}lib/jquery-1.8.0.min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}lib/jquery.slideto.min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}lib/jquery.wiggle.min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}lib/jquery.ba-bbq.min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}lib/handlebars-2.0.0.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}lib/js-yaml.min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}lib/lodash.min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}lib/backbone-min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}swagger-ui.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}lib/highlight.7.3.pack.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}lib/jsoneditor.min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}lib/marked.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}lib/swagger-oauth.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}extend.js' type='text/javascript'></script>

<!-- Some basic translations -->
<script src='{{hapiSwagger.swaggerUIPath}}lang/translator.js' type='text/javascript'></script>
<script src='{{hapiSwagger.swaggerUIPath}}lang/{{hapiSwagger.lang}}.js' type='text/javascript'></script>

<script type="text/javascript">

    // creates a list of tags in the order they where created
    var tags = []
    {{#each hapiSwagger.tags}}
    tags.push('{{name}}');
    {{/each}}


    $(function () {

        $('#input_apiKey').hide();

        var url = window.location.search.match(/url=([^&]+)/);
        if (url && url.length > 1) {
            url = decodeURIComponent(url[1]);
        } else {
            url = "{{{hapiSwagger.jsonPath}}}";
        }

        // Pre load translate...
        if(window.SwaggerTranslator) {
            window.SwaggerTranslator.translate();
        }

        // pull validatorUrl string or null form server
        var validatorUrl = null;
        {{#if hapiSwagger.validatorUrl}}
        validatorUrl: '{{hapiSwagger.validatorUrl}}';
        {{/if}}

        window.swaggerUi = new SwaggerUi({
            url: url,
            dom_id: "swagger-ui-container",
            supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
            onComplete: function (swaggerApi, swaggerUi) {
                if (typeof initOAuth == "function") {
                    initOAuth({
                        clientId: "your-client-id",
                        clientSecret: "your-client-secret",
                        realm: "your-realms",
                        appName: "your-app-name",
                        scopeSeparator: ","
                    });
                }

                if (window.SwaggerTranslator) {
                    window.SwaggerTranslator.translate();
                }

                $('pre code').each(function (i, e) {
                    hljs.highlightBlock(e)
                });

                if (Array.isArray(swaggerApi.auths) && swaggerApi.auths.length > 0 && swaggerApi.auths[0].type === "apiKey") {
                    auth = swaggerApi.auths[0].value;
                    $('#input_apiKey').show();
                }
                //addApiKeyAuthorization();
            },
            onFailure: function (data) {
                log("Unable to Load SwaggerUI");
            },
            docExpansion: "{{hapiSwagger.expanded}}",
            apisSorter: apisSorter.{{hapiSwagger.sortTags}},
            operationsSorter: operationsSorter.{{hapiSwagger.sortEndpoints}},
            showRequestHeaders: false,
            validatorUrl: '{{hapiSwagger.validatorUrl}}',
            jsonEditor: {{#if hapiSwagger.jsonEditor}}true{{else}}false{{/if}}
        });

        function addApiKeyAuthorization() {
            if($('#input_apiKey')){
                var key = $('#input_apiKey')[0].value;
                if (key && key.trim() != "") {
                    if('{{{hapiSwagger.keyPrefix}}}' !== ''){
                       key = '{{{hapiSwagger.keyPrefix}}}' + key;
                    }
                    var apiKeyAuth = new SwaggerClient.ApiKeyAuthorization(auth.name, key, auth.in);
                    window.swaggerUi.api.clientAuthorizations.add(auth.name, apiKeyAuth);
                    log("added key " + key);
                }
            }
        }

        $('#input_apiKey').change(addApiKeyAuthorization);

        window.swaggerUi.load();

        function log() {
            if ('console' in window) {
                console.log.apply(console, arguments);
            }
        }
  });
```


### Adding the HTML elements
Place the HTML code below into the body fo web page where you wish the interface to render

```
<section class="swagger-section">
    <h1 class="entry-title api-title">API</h1>
    <div id="swagger-ui-container" class="swagger-ui-wrap"></div>
</section>
```

### Custom tag-specific documentation
If you want to generate tag-specific documentation, you should change the URL in the Javascript above from

```javascript
url: window.location.protocol + '//' + window.location.host + '{{hapiSwagger.endpoint}}',
```
to:
```javascript
url: window.location.protocol + '//' + window.location.host + '{{hapiSwagger.endpoint}}?tags=foo,bar,baz',
```
This will load all routes that have one or more of the given tags (`foo` or `bar` or `baz`). More complex use of tags include:

    ?tags=mountains,beach,horses
    this will show routes WITH 'mountains' OR 'beach' OR 'horses'

    ?tags=mountains,beach,+horses
    this will show routes WITH ('mountains' OR 'beach')  AND 'horses'

    ?tags=mountains,+beach,-horses
    this will show routes WITH 'mountains' AND 'beach' AND NO 'horses'

# Example code in project
There are a number of examples of different uses of `hapi-swagger` in the examples directory. These files contain a full HAPI node app:

*  [`custom.js`](examples/custom.js) - how build a custom documentation page with its own CSS and JS
*  [`debug.js`](examples/debug.js) - how console.log debug information from `hapi-swagger`
*  [`group-ordered.js`](examples/group-ordered.js) - how group and ordered endpoints in the UI
*  [`jwt.js`](examples/jwt.js) - how to used the plug-in in combination with JSON Web Tokens (JWT) `securityDefinition`
*  [`options.js`](examples/options.js) - how to use many of the plug-ins options
*  [`promise.js`](examples/promise.js) - how to setup the plug-in using promises
*  [`swagger-client.js`](examples/swagger-client.js) - how use the plug-in to build an lib interface with `swagger-client`
*  [`upload-file.js`](examples/upload-file.js) - how create documenation for a file upload
*  [`versions.js`](examples/versions.js) - how to use the plug-in with `hapi-api-version` for versioning of an API

# External example projects
Both these example use a custom HTML page
*  [`be-more-hapi`](https://github.com/glennjones/be-more-hapi) - talk from Async.js on the October 2013 - old `hapi-swagger` example project, but keep update
*  [`hapi-token-docs`](https://github.com/glennjones/hapi-token-docs) - A example site using HAPI, JWT tokens and swagger documentation
*  [`time-to-be-hapi`](https://github.com/glennjones/time-to-be-hapi) - Londonjs talk March 2016 has many example uses of HAPI and one using `hapi-swagger`
