# hapi-swagger

This is a [The OpenAPI (aka Swagger)](https://openapis.org/) plug-in for [HAPI](http://hapijs.com/) v9.x to v12.x  When installed it will self document the API interface
in a project.

[![build status](https://img.shields.io/travis/glennjones/hapi-swagger.svg?style=flat-square)](http://travis-ci.org/glennjones/hapi-swagger)
[![Coverage Status](https://img.shields.io/coveralls/glennjones/hapi-swagger/dev.svg?style=flat-square)](https://coveralls.io/r/glennjones/hapi-swagger)
[![npm downloads](https://img.shields.io/npm/dm/hapi-swagger.svg?style=flat-square)](https://www.npmjs.com/package/hapi-swagger)
[![MIT license](http://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://raw.github.com/glennjones/microformat-shic/master/license.txt)


__NEW VERSION (v3.0.0 DEC 2015) - PLEASE REVIEW UPDATE INFORMATION - [Breaking changes in release notes](https://github.com/glennjones/hapi-swagger/issues/180)__


## Install

You can add the module to your HAPI using npm:

    $ npm install hapi-swagger --save

If you want to view the documentation from your API you will also need to install the `inert` and `vision` plugs-ins which support templates and static
content serving. If you wish just to used swagger.json without the documentation for example with swagger-codegen simply set `enableDocumentation` to `false`.

    $ npm install inert --save
    $ npm install vision --save

## Adding the plug-in into your project

In your apps main .js file add the following code to created a `server` object:

```Javascript
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');

const server = new Hapi.Server();
server.connection({
        host: 'localhost',
        port: 3000
    });

const swaggerOptions = {
    info: {
            'title': 'Test API Documentation',
            'version': Pack.version,
        }
    };

server.register([
    Inert,
    Vision,
    {
        register: HapiSwagger,
        options: swaggerOptions
    }], (err) => {
        server.start( () => {
            console.log('Server running at:', server.info.uri);
        });
    });

server.route(Routes);
```

## Tagging your API routes
As a project may be a mixture of web pages and API endpoints you need to tag the routes you wish Swagger to document. Simply add the `tags: ['api']` property to the route object for any endpoint you want documenting.

You can even specify more tags and then later generate tag-specific documentation. If you specify `tags: ['api', 'foo']`, you can later use `/documentation?tags=foo` to load the documentation on the HTML page (see next section).

```Javascript
{
    method: 'GET',
    path: '/todo/{id}/',
    config: {
        handler: handlers.mapUsername,
        description: 'Get todo',
        notes: 'Returns a todo item by the id passed in the path',
        tags: ['api'],
        validate: {
            params: {
                username: Joi.number()
                        .required()
                        .description('the id for the todo item'),
            }
        }
    },
}
```

## Viewing the documentation page
The plugin adds a page into your site with the route `/documentation`. This page contains Swaggers UI to allow users to explore your API. You can also build custom pages on your own URL paths if you wish, see: "Adding interface into a page"


## Options (Plug-in level)
There are number of options for advance use cases. Most of the time you should only have to provide the `info.title` and `info.version`.

Options for UI:
* `schemes`: (array) The transfer protocol of the API ie `['http']`
* `host`: (string) The host (name or ip) serving the API including port if any i.e. `localhost:8080`
* `basePath`: (string) The base path from where the API starts i.e. `/v2/` (note, needs to start with `/`) -  default: `/`
* `pathPrefixSize`: (number) Selects what segment of the URL path is used to group endpoints
* `enableDocumentation`:  (boolean) Add documentation page - default: `true`,
* `documentationPath`:  (string) The path of the documentation page - default: `/documentation`,
* `jsonPath`: (string) The path of JSON that describes the API - default: `/swagger.json`
* `swaggerUIPath`: (string) The path for the interface files - default: `/swaggerui/`
* `expanded`: (boolean) If UI is expanded when opened - default: `true`
* `sortPaths`: (string) the path sort method for JSON. `unsorted` or `path-method`,
* `lang`: (string) The language of the UI either `en`, `es`, `pt` or `ru`  - default: `en`
* `tags`: (object) Containing [Tag Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#tagObject) used to group endpoints in swagger-ui.
* `securityDefinitions:`: (array) Containing [Security Definitions Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityDefinitionsObject). No defaults are provided.

Defaults for routes settings (these can also be set a individual path level):
* `payloadType`: (string) How payload parameters are displayed `json` or `form` - default: `json`
* `consumes`: (array) The mimetypes consumed  - default: `['application/json']`
* `produces`: (array) The mimetypes produced  - default: `['application/json']`

Info object (this information will be added into the UI):
* `info.title` (string) Required. The title of the application
* `info.description` (string)  A short description of the application
* `info.termsOfService` (string) A URL to the Terms of Service of the API
* `info.contact.name` (string) A contact name for the API
* `info.contact.url` (string) A URL pointing to the contact information. MUST be formatted as a URL
* `info.contact.email` (string) A email address of the contact person/organization. MUST be formatted as an email address.
* `info.license.name` (string) The name of the license used for the API
* `info.license.url` (string) The URL to the license used by the API. MUST be formatted as a URL
* `info.version` (string) The version number of the API

### Option example
```Javascript
const swaggerOptions = {
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
```

## Options (Within a HAPI route)
* `payloadType`: (string) How payload parameters are displayed `json` or `form` - default: `json`
* `consumes`: (array) The mimetypes consumed  - default: `['application/json']`
* `produces`: (array) The mimetypes produced  - default: `['application/json']`
* `security:`: (array) Containing [Security Requirement Object](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#securityRequirementObject). No defaults are provided.

### Grouping endpoints with tags
Swagger provides a tag object which allows you to group your endpoints in the swagger-ui interface. The name of the tag needs to match path of your endpoinds, so in the example below all enpoints with the path `/store` and `/sum` will be group togther.
```Javascript
let swaggerOptions = {
    info: {
        'title': 'Test API Documentation',
        'version': Pack.version,
    },
    tags: [{
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

### Route option example
The route level options are always placed within the `plugins.hapi-swagger` object under `config`. These options are only assigned to the route they are apply to.
```Javascript
{
		method: 'PUT',
		path: '/store/{id}',
		config: {
			handler: handlers.storeUpdate,
			plugins: {
				'hapi-swagger': {
					responses: {'400': {'description': 'Bad Request'}},
					payloadType: 'form'
				}
			},
			tags: ['api'],
			validate: {
				payload: {
					a: Joi.number()
						.required()
						.description('the first number')

				}
			}
		}
	}
```



### Response Object
HAPI allow you to define a response object for an API endpoint. The response object is used by HAPI to both validation and description the output of an API. It uses the same JOI validation objects to describe the input parameters. The plugin turns these object into visual description and examples in the Swagger UI.

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



### Status Codes
You can add HTTP status codes to each of the endpoints. As HAPI routes don not directly have a property for status codes so you need to add them the plugin configuration. The status codes need to be added as an array of objects with an error code and description. The `description` is required, the schema is optional and unlike added response object the example above this method does not validate the API response.

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
                        'scahema': Joi.object({
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
### File upload
The plug-in has basic support for file uploads into your API's. Below is an example of a route with a file upload, the three important elements are:

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
The  https://github.com/glennjones/be-more-hapi project has an example of file upload with the handler function dealing with validation, such as filetype and schema validation.

### Naming
There are times when you may wish to name a object so that its label in the Swagger interface make more sense to humans. This is most common when you have endpoint which take JSON structures. To label a object simply wrap it as a JOI object and chain the label function as below. __You need to give different structure its own unique name.__
```Javascript
validate: {
    payload: Joi.object({
        a: Joi.number(),
        b: Joi.nunber()
    }).label('Sum')
}
```

### Default values and examples
You can add both default values and examples to your JOI objects which are displayed within the Swagger interface. Defaults are turned into pre-fill values, either in the JSON of a payload or in the text inputs of forms.

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

### Headers and .unknown()
A common issue with the use of headers is that you may only want to validate some of the headers sent in a request and you are not concerned about other headers that maybe sent also. You can use JOI .unknown() to allow any all other headers to be sent without validation errors.
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


## Adding the interface into your own custom page
The plugin adds all the resources needed to build the interface into your any page in your project. All you need to do is add some javascript into the header of a web page and add two elements into the HTML where you wish it to render. The example [be-more-hapi](https://github.com/glennjones/be-more-hapi) project makes use of a custom page where the interface is used with other elements.


### Adding the javascript

The all the files in the URLs below are added by the plugin, but you must server the custom page as template using `reply.view()`.

```html
<link rel="icon" type="image/png" href="{{hapiSwagger.swaggerUIPath}}images/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="{{hapiSwagger.swaggerUIPath}}images/favicon-16x16.png" sizes="16x16" />
  <link href='{{hapiSwagger.swaggerUIPath}}css/typography.css' media='screen' rel='stylesheet' type='text/css'/>
  <link href='{{hapiSwagger.swaggerUIPath}}css/reset.css' media='screen' rel='stylesheet' type='text/css'/>
  <link href='{{hapiSwagger.swaggerUIPath}}css/screen.css' media='screen' rel='stylesheet' type='text/css'/>
  <link href='{{hapiSwagger.swaggerUIPath}}css/reset.css' media='print' rel='stylesheet' type='text/css'/>
  <link href='{{hapiSwagger.swaggerUIPath}}css/print.css' media='print' rel='stylesheet' type='text/css'/>
  <script src='{{hapiSwagger.swaggerUIPath}}lib/jquery-1.8.0.min.js' type='text/javascript'></script>
  <script src='{{hapiSwagger.swaggerUIPath}}lib/jquery.slideto.min.js' type='text/javascript'></script>
  <script src='{{hapiSwagger.swaggerUIPath}}lib/jquery.wiggle.min.js' type='text/javascript'></script>
  <script src='{{hapiSwagger.swaggerUIPath}}lib/jquery.ba-bbq.min.js' type='text/javascript'></script>
  <script src='{{hapiSwagger.swaggerUIPath}}lib/handlebars-2.0.0.js' type='text/javascript'></script>
  <script src='{{hapiSwagger.swaggerUIPath}}lib/underscore-min.js' type='text/javascript'></script>
  <script src='{{hapiSwagger.swaggerUIPath}}lib/backbone-min.js' type='text/javascript'></script>
  <script src='{{hapiSwagger.swaggerUIPath}}swagger-ui.js' type='text/javascript'></script>
  <script src='{{hapiSwagger.swaggerUIPath}}lib/highlight.7.3.pack.js' type='text/javascript'></script>
  <script src='{{hapiSwagger.swaggerUIPath}}lib/marked.js' type='text/javascript'></script>
  <script src='{{hapiSwagger.swaggerUIPath}}lib/swagger-oauth.js' type='text/javascript'></script>

  <!-- Some basic translations -->
  <script src='{{hapiSwagger.swaggerUIPath}}/lang/translator.js' type='text/javascript'></script>
  <script src='{{hapiSwagger.swaggerUIPath}}/lang/{{hapiSwagger.lang}}.js' type='text/javascript'></script>

  <script type="text/javascript">
    $(function () {
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
      window.swaggerUi = new SwaggerUi({
        url: url,
        dom_id: "swagger-ui-container",
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function(swaggerApi, swaggerUi){
          if(window.SwaggerTranslator) {
            window.SwaggerTranslator.translate();
          }
          $('pre code').each(function(i, e) {
            hljs.highlightBlock(e)
          });
        },
        onFailure: function(data) {
          log("Unable to Load SwaggerUI");
        },
        docExpansion: "{{hapiSwagger.expanded}}",
        apisSorter: "alpha",
        showRequestHeaders: false
      });

      window.swaggerUi.load();

      function log() {
        if ('console' in window) {
          console.log.apply(console, arguments);
        }
      }
  });
</script>
```


### Adding the HTML elements
Place the HTML code below into the body fo web page where you wish the interface to render

```html
<section id="swagger">
    <h1 class="entry-title api-title">API</h1>
    <div id="message-bar" class="swagger-ui-wrap"></div>
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



### Lab test
The project has integration and unit tests. To run the test within the project type one of the following commands.
```bash
$ lab
$ lab -r html -o coverage.html
$ lab -r html -o coverage.html --lint
$ lab -r console -o stdout -r html -o coverage.html --lint
```

If you are considering sending a pull request please add tests for the functionality you add or change.


### Thanks
I would like all that have contributed to the project over the last couple of years.

### Issues
If you find any issue please file here on github and I will try and fix them.