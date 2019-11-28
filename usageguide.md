# Usage Guide

## Content

-   [JSON body](#json-body)
-   [Form body](#form-body)
-   [Params query and headers](#params-query-and-headers)
-   [Naming](#naming)
-   [Grouping endpoints by path or tags](#grouping-endpoints-by-path-or-tags)
-   [Extending group information with tag objects](#extending-group-information-with-tag-objects)
-   [Ordering the endpoints within groups](#ordering-the-endpoints-within-groups)
-   [Rewriting paths and groupings](#rewriting-paths-and-groupings)
-   [Response Object](#response-object)
-   [Status Codes](#status-codes)
-   [Caching](#caching)
-   [File upload](#file-upload)
-   [Headers and .unknown()](#headers-and-unknown)
-   [Additional Hapi data using x-\*](#additional-hapi-data-using-x-)
-   [JSON without UI](#json-without-ui)
-   [Simplifying the JSON](#simplifying-the-json)
-   [Debugging](#debugging)
-   [Features from Hapi that cannot be ported to Swagger](#features-from-hapi-that-cannot-be-ported-to-swagger)

## Links

-   [Example code in project](#example-code-in-project)
-   [External example projects](#external-example-projects)

## JSON body

The most common API endpoint with Hapi.js is one that POST's a JSON body.

```javascript
{
    method: 'POST',
    path: '/items',
    options: {
        handler: (request, h) => { return 'OK'; },
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

## Form body

If you wish to have hapi-swagger display a interface to POST data in `form-urlencoded` format add the route option `payloadType: 'form'`.

```javascript
{
    method: 'POST',
    path: '/items',
    options: {
        handler: (request, h) => { return 'OK'; },
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

## Params query and headers

The plugin will take either a JavaScript or JOI object for `params` `query` and `headers` and build the correct interface.

```javascript
{
    method: 'GET',
    path: '/items/{pageNo}',
    options: {
        handler: (request, h) => { return 'OK'; },
        tags: ['api'],
        validate: {
            params: Joi.object({
                pageNo: Joi.number()
            }),
            query: Joi.object({
                search: Joi.string()
            }),
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

## Naming

There are times when you may wish to name a object so that its label in the Swagger UI make more sense to humans.
This is most common when you have endpoints which process JSON objects. To label a object wrap it as a JOI object
and chain the `label` function as below. **You need to give different structures their own unique name.**

```javascript
validate: {
    payload: Joi.object({
        a: Joi.number(),
        b: Joi.number()
    }).label('Sum');
}
```

**NOTE: the plugin reuses "definition models" these describe each JSON object use by an API i.e. a "user". This feature
was added to reduce the size of the JSON. The reuse of models can cause names to be reused as well. Please switch
`options.reuseDefinitions` to `false` if you are naming your JOI objects. By default objects are named in a "Model #"
format. To use the `label`, specify `options.definitionPrefix` as `useLabel`.**

## Grouping endpoints by path or tags

The plugin will by default group your endpoints using information in the path. So `\users\{id}` and `\users\{id}\history` would be
group together under the title `users`. How the path based grouping works is controlled by using the `options.basePath`
and `options.pathPrefixSize` properties.

If you wish to create groups of your own making you can use the `options.grouping: tags` property. You need also need to define
custom tags for each route as below.

```javascript
let options = {
    info: {
        title: 'Test API Documentation',
        version: Pack.version
    },
    grouping: 'tags'
};

let routes = [
    {
        method: 'GET',
        path: '/petstore/{id}',
        options: {
            handler: (request, h) => {
                return { ok: true };
            },
            description: 'Array properties',
            tags: ['api', 'petstore']
        }
    },
    {
        method: 'GET',
        path: '/store/{id}/address',
        options: {
            handler: (request, h) => {
                return { ok: true };
            },
            description: 'Array properties',
            tags: ['api', 'petstore']
        }
    }
];
```

Both the routes above would be grouped in `petstore`. This is because the second tag in each route is set to `petstore` and
the `options.grouping` is set to `tags`

## Extending group information with tag objects

Swagger provides a tag object which allows you extend the information provide for a group of endpoints in the UI.
You must match the `name` in the `options.tags` array items with the `path` fragmenets or `tags` used to create groups.

```javascript
let options = {
    info: {
        title: 'Test API Documentation',
        version: Pack.version
    },
    tags: [
        {
            name: 'users',
            description: 'Users data'
        },
        {
            name: 'store',
            description: 'Storing a sum',
            externalDocs: {
                description: 'Find out more about storage',
                url: 'http://example.org'
            }
        },
        {
            name: 'sum',
            description: 'API of sums',
            externalDocs: {
                description: 'Find out more about sums',
                url: 'http://example.org'
            }
        }
    ]
};
```

The groups are order in the same sequence you add them to the `tags` array in the plug-in options. You can enforce
the order by name A-Z by switching the plugin `options.sortTags = 'name'`.

## Ordering the endpoints within groups

The endpoints within the UI groups can be order with the property `options.sortEndpoints`, by default the are ordered
A-Z using the `alpha` (path) information. Can also order them by `method`. Finally if you wish to enforce you own order then
you added route option `order` to each endpoint and switch the plugin options to `options.sortEndpoints = 'ordered'`.

```javascript
{
    method: 'PUT',
    path: '/test',
    options: {
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

## Rewriting paths and groupings

There are two ways to change to do this:
There are time you may wish to modify how groups and endpoint paths are displayed within the documentation.

### Option 1 `basePath` and `pathPrefixSize`

You can use the plugin options `basePath` and `pathPrefixSize` to trim what path information is shown in the documentation.
This will not change the API endpoint URL only the path information in the documentation.

```javascript
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

```javascript
pathReplacements: [
    {
        replaceIn: 'all',
        pattern: /v([0-9]+)\//,
        replacement: ''
    }
];
```

-   `replaceIn` (string) defines what to alter, can be: 'groups', 'endpoints' or 'all'
-   `pattern` (regex) patten for matching
-   `replacement` (string) replacement string

There is a example of this feature [`dot-grouping.js`](examples/dot-grouping.js) in the examples directory.

## Response Object

Hapi allow you to define a response object for an API endpoint. The response object is used by Hapi to both validate
and describe the output of an API. It uses the same JOI validation objects to describe the input parameters. The
plugin turns these object into visual description and examples in the Swagger UI.

An very simple example of the use of the response object:

```javascript
const responseModel = Joi.object({
    equals: Joi.number()
}).label('Result');
```

within you route object ...

```javascript
options: {
    handler: handlers.add,
    description: 'Add',
    tags: ['api'],
    notes: ['Adds together two numbers and return the result'],
    validate: {
        params: Joi.object({
            a: Joi.number()
                .required()
                .description('the first number'),

            b: Joi.number()
                .required()
                .description('the second number')
        })
    },
    response: {schema: responseModel}
}
```

A working demo of more complex uses of response object can be found in the [be-more-hapi](https://github.com/glennjones/be-more-hapi) project.

## Status Codes

You can add HTTP status codes to each of the endpoints.
As of Hapi.js `v18.1.0`, one can use Hapi's `response.status` option in order to document the schemas of the response objects. Hapi uses the `response.status` for its validation with Joi.

```javascript
options: {
    handler: handlers.add,
    description: 'Add',
    tags: ['api'],
    notes: ['Adds together two numbers and return the result'],
    response: {
        status: {
            200: Joi.object({
                equals: Joi.number()
            }).label('Result'),
            400: Joi.any()
        }
    },
    validate: {
        params: Joi.object({
            a: Joi.number()
                .required()
                .description('the first number'),

            b: Joi.number()
                .required()
                .description('the second number')
        })
    }
}
```

**Note:** The `Reason` box in Swagger-UI for the response will take the value of the default description of its' corresponding status code.
For example:

-   200 -> `Successful`
-   400 -> `Bad Request`
-   404 -> `Not Found`
-   204 -> `No Content`

Basically, Swagger requires a `description` for each response, and by taking the default description we can overcome this requirement. Setting `response.status.204` to `undefined` will allow **hapi-swagger** to pass-through the description of `No Content` to the swagger definition.

However, if one wishes to provide a custom `description`, then hapi-swagger offers the `plugins.hapi-swager.responses` option in which response objects specify a `description` key which allows this.
With this option, the `description` is required, the `schema` is optional, and unlike `response.status` option above, the schema object does not validate the API response.

In the following example, the `Reason` box in Swagger-UI will show the following descriptions:

-   200 -> `Smooth sail`
-   400 -> `Something wrong happened`

```javascript
options: {
    handler: handlers.add,
    description: 'Add',
    tags: ['api'],
    notes: ['Adds together two numbers and return the result'],
    plugins: {
        'hapi-swagger': {
            responses: {
                200: {
                    description: 'Smooth sail',
                    schema: Joi.object({
                        equals: Joi.number()
                    }).label('Result')
                },
                204: undefined, // pass-through "No Content" to swagger definition
                400: {
                    description: 'Something wrong happened'
                }
            }
        }
    },
    validate: {
        params: Joi.object({
            a: Joi.number()
                .required()
                .description('the first number'),

            b: Joi.number()
                .required()
                .description('the second number')
        })
    }
}
```

## Caching

It can take some time to create the `swagger.json` data if your server has many complex routes. So `hapi-swagger`
can cache its `swagger.json` data. The cache options are those of Hapi

```javascript
options.cache: {
    expiresIn: 24 * 60 * 60 * 1000
}
```

or

```javascript
options.cache = {
    expiresAt: '23:59'
};
```

-   `expiresIn` - relative expiration expressed in milliseconds since the item was saved in the cache. Cannot be used together with `expiresAt`.
-   `expiresAt` - time of day expressed in 24h notation using the 'HH:MM' format, at which point all cache records expire. Uses local time. Cannot be used together with `expiresIn`.

**NOTE: The plugin has a number of internal caching features which do help its speed, but this options caches
the whole JSON output.**

## File upload

The plug-in has basic support for file uploads into your API's. Below is an example of a route with a file upload,
the three important elements are:

-   `payloadType: 'form'` in the plugins section creates a form for upload
-   `.meta({ swaggerType: 'file' })` add to the payload property you wish to be file upload
-   `payload` configuration how Hapi will process file

```javascript
{
    method: 'POST',
    path: '/store/file/',
    options: {
        handler: handlers.storeAddFile,
        plugins: {
            'hapi-swagger': {
                payloadType: 'form'
            }
        },
        tags: ['api'],
        validate: {
            payload: Joi.object({
                file: Joi.any()
                    .meta({ swaggerType: 'file' })
                    .description('json file')
            })
        },
        payload: {
            maxBytes: 1048576,
            parse: true,
            output: 'stream'
        },
        response: {schema : sumModel}
}
```

## Default values and examples

You can add both default values and examples to your JOI objects which are displayed within the Swagger interface.
Defaults are turned into pre-fill values, either in the JSON of a payload or in the text inputs of forms.

```javascript
validate: {
    payload: Joi.object({
        a: Joi.number().default('10'),
        b: Joi.number().default('15')
    }).label('Sum');
}
```

Examples are only shown in the JSON objects and are not used in the text inputs of forms. This is a limitations of Swagger.

```javascript
validate: {
    payload: Joi.object({
        a: Joi.number().example('10'),
        b: Joi.number().example('15')
    }).label('Sum');
}
```

## Headers and .unknown()

A common issue with the use of headers is that you may only want to validate some of the headers sent in a request and
you are not concerned about other headers that maybe sent also. You can use JOI .unknown() to allow any all other
headers to be sent without validation errors.

```javascript
validate: {
    params: Joi.object({
        a: Joi.number()
            .required()
            .description('the first number'),

        b: Joi.number()
            .required()
            .description('the second number')
    }),
    headers: Joi.object({
         'authorization': Joi.string().required()
    }).unknown()
}
```

## Additional Hapi data using `x-*`

The OpenAPI spec allows for the addition of new properties and structures as long as they their name start with `x-`.
Where possible I have mapped many of Hapi/Joi properties into the swagger.json file.

This includes `Joi.alternatives()` where `try(...)` defines more than one possible structure. The inclusion of
alternatives model means the the swagger.json may also contain `x-alt-definitions` object to store
alternatives models.

## JSON without UI

If you wish just to use the `swagger.json` endpoint without the automatically generated documentation page simply set `options.documentationPage` to `false`.
You can still create a custom page and make use of the SwaggerUI files.

If you wish only to use the JSON output of the plugin for example with `swagger-codegen` and then set both `documentationPage` and `swaggerUI` set to false:

```javascript
options: {
    documentationPage: false,
    swaggerUI: false
}
```

With both `documentationPage` and `swaggerUI` set to false you do not need to load `Inert` and `Vision` plugins to use `hapi-swagger`.

## Simplifying the JSON

The JSON output for OpenAPI(Swagger) is based on the JSONSchema standard which allows for the internal referencing of object
structures using `$ref`. If you wish to simplify the JSON you can use plugin option `options.deReference = true`. This can
be useful if your are using codegen tools against the JSON

## Debugging

The plugin can validate its output against the OpenAPI(Swagger) specification. You can to this by setting the plugin option `options.debug` to `true`.
The debug output is logged into the Hapi server object. You can view the logs by either install the `Good` plugin or by using `server.on`.

There is a small example of the [`debug`](examples/debug.js) feature in the examples directory.

## Features from Hapi that cannot be ported to Swagger

Not all the flexibility of Hapi and JOI can to ported over to the Swagger schema. Below is a list of the most common asked for features that cannot be ported.

-   **`Joi.extend()`** Only works if you are extending a `base` type such as `number` or `string`
-   **`Joi.lazy()`** This new `JOI` feature needs more research to see if its possible to visual describe recursive objects before its supported.
-   **`Joi.alternatives()`** This allows parameters to be more than one type. i.e. string or int. ~~Swagger does not yet support this because of a number codegen tools using swagger build to typesafe languages. This **maybe** added to the next version of OpenAPI spec. (Experimental support allow for the first of any options to be displayed)~~
-   **`Joi.forbidden()`** There is only limited support `.forbidden()` with `.alternatives()`
-   **`array.ordered(type)`** This allows for different typed items within an array. i.e. string or int.
-   **`{name*}`** The path parameters with the `*` char are not supported, either is the `{name*3}` the pattern. This will mostly likely be added to the next version of OpenAPI spec.
-   **`.allow( null )`** The current Swagger spec does not support `null`. This **maybe** added to the next version of OpenAPI spec.
-   **`payload: function (value, options, next) {next(null, value);}`** The use of custom functions to validate pramaters is not support beyond replacing them with an emtpy model call "Hidden Model".
-   **`Joi.date().format('yy-mm-dd')` ** The use of a `moment` pattern to format a date cannot be reproduced in Swagger
-   **`Joi.date().min()` and `Joi.date().max()`** Minimum or maximum dates cannot be expressed in Swagger.

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

## Example code in project

There are a number of examples of different uses of `hapi-swagger` in the examples directory. These files contain a full Hapi node app:

-   [`custom.js`](examples/custom.js) - how build a custom documentation page with its own CSS and JS
-   [`debug.js`](examples/debug.js) - how console.log debug information from `hapi-swagger`
-   [`group-ordered.js`](examples/group-ordered.js) - how group and ordered endpoints in the UI
-   [`jwt.js`](examples/jwt.js) - how to used the plug-in in combination with JSON Web Tokens (JWT) `securityDefinition`
-   [`options.js`](examples/options.js) - how to use many of the plug-ins options
-   [`promise.js`](examples/promise.js) - how to setup the plug-in using promises
-   [`swagger-client.js`](examples/swagger-client.js) - how use the plug-in to build an lib interface with `swagger-client`
-   [`upload-file.js`](examples/upload-file.js) - how create documenation for a file upload
-   [`versions.js`](examples/versions.js) - how to use the plug-in with `hapi-api-version` for versioning of an API

## External example projects

Both these example use a custom HTML page

-   [`be-more-hapi`](https://github.com/glennjones/be-more-hapi) - talk from Async.js on the October 2013 - old `hapi-swagger` example project, but keep update
-   [`hapi-token-docs`](https://github.com/glennjones/hapi-token-docs) - A example site using Hapi, JWT tokens and swagger documentation
-   [`time-to-be-hapi`](https://github.com/glennjones/time-to-be-hapi) - Londonjs talk March 2016 has many example uses of Hapi and one using `hapi-swagger`
