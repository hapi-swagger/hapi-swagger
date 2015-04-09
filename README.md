# hapi-swagger


This is a [Swagger UI](https://github.com/wordnik/swagger-ui) plug-in for [HAPI](http://hapijs.com/) v8.x  When installed it will self document HTTP API interface in a project.


## Install

You can add the module to your HAPI using npm:

    $ npm install hapi-swagger --save


## Adding the plug-in into your project

In the .js file where you create the HAPI `server` object add the following code after you have created the `server` object:

```Javascript
var pack = require('../package'),
    swaggerOptions = {
        apiVersion: pack.version
    };

server.register({
        register: require('hapi-swagger'),
        options: swaggerOptions
    }, function (err) {
        if (err) {
            server.log(['error'], 'hapi-swagger load error: ' + err)
        }else{
            server.log(['start'], 'hapi-swagger interface loaded')
        }
    });
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






## Adding interface into a page
The plugin adds all the resources needed to build the interface into your any page in your project. All you need to do is add some javascript into the header of a web page and add two elements into the HTML where you wish it to render. The example [be-more-hapi](https://github.com/glennjones/be-more-hapi) project makes use of a custom page where the interface is used with other elements.


### Adding the javascript

The all the files in the URLs below are added by the plugin, but you must server the custom page as template using `reply.view()`. 

```html
<link href='https://fonts.googleapis.com/css?family=Droid+Sans:400,700' rel='stylesheet' type='text/css'/>
<link href='{{hapiSwagger.endpoint}}/swaggerui/css/highlight.default.css' media='screen' rel='stylesheet' type='text/css'/>
<link href='{{hapiSwagger.endpoint}}/swaggerui/css/screen.css' media='screen' rel='stylesheet' type='text/css'/>
<script src='{{hapiSwagger.endpoint}}/swaggerui/lib/shred.bundle.js' 'type=text/javascript'></script>
<script src='{{hapiSwagger.endpoint}}/swaggerui/lib/jquery-1.8.0.min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.endpoint}}/swaggerui/lib/jquery.slideto.min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.endpoint}}/swaggerui/lib/jquery.wiggle.min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.endpoint}}/swaggerui/lib/jquery.ba-bbq.min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.endpoint}}/swaggerui/lib/handlebars-1.0.0.js' type='text/javascript'></script>
<script src='{{hapiSwagger.endpoint}}/swaggerui/lib/underscore-min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.endpoint}}/swaggerui/lib/backbone-min.js' type='text/javascript'></script>
<script src='{{hapiSwagger.endpoint}}/swaggerui/lib/swagger.js' type='text/javascript'></script>
<script src='{{hapiSwagger.endpoint}}/swaggerui/swagger-ui.js' type='text/javascript'></script>
<script src='{{hapiSwagger.endpoint}}/swaggerui/lib/highlight.7.3.pack.js' type='text/javascript'></script>
<script src='{{hapiSwagger.endpoint}}/custom.js' type='text/javascript'></script>
<script type="text/javascript">
  $(function () {
    window.swaggerUi = new SwaggerUi({
      url: window.location.protocol + '//' + window.location.host + '{{hapiSwagger.endpoint}}',
      dom_id: "swagger-ui-container",
      supportedSubmitMethods: ['get', 'post', 'put', 'delete'],
      onComplete: function(swaggerApi, swaggerUi){
        log("Loaded SwaggerUI")
        $('pre code').each(function(i, e) {
            hljs.highlightBlock(e)
        });
        $('.response_throbber').attr( 'src', '{{hapiSwagger.endpoint}}/swaggerui/images/throbber.gif' );
      },
      onFailure: function(data) {
        log("Unable to Load SwaggerUI");
      },
      docExpansion: "list"
    });
    window.swaggerUi.load();
  });
</script>
```

If you want to generate tag-specific documentation, you should change the URL from
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


### Adding the HTML elements

Place the HTML code below into the body fo web page where you wish the interface to render

```html
<section id="swagger">
    <h1 class="entry-title api-title">API</h1>
    <div id="message-bar" class="swagger-ui-wrap"></div>
    <div id="swagger-ui-container" class="swagger-ui-wrap"></div>
</section>
```


### Options
There are number of options for advance use case. In most case you should only have to provide the apiVersion.

* `apiVersion`: string The version of your API
* `basePath`: string The base URL of the API i.e. `http://localhost:3000`
* `documentationPath`:  string The path of the documentation page - default: `/documentation`,
* `enableDocumentationPage`: boolean Enable the the documentation page - default: `true`,
* `endpoint`: string the JSON endpoint that descibes the API - default: `/docs`
* `pathPrefixSize`: number Selects what segment of the URL path is used to group endpoints - default: `1`
* `payloadType`: string Weather accepts `json` or `form` parameters for payload - default: `json`
* `produces`: array The output types from your API - the default is: `['application/json']`
* `authorizations`: object Containing [swagger authorization objects](https://github.com/swagger-api/swagger-spec/blob/master/versions/1.2.md#515-authorization-object), the keys mapping to HAPI auth strategy names. No defaults are provided.
* `info`: a [swagger info object](https://github.com/swagger-api/swagger-spec/blob/master/versions/1.2.md#513-info-object) with metadata about the API.
    * `title`   string  Required. The title of the application
    * `description` string  Required. A short description of the application
    * `termsOfServiceUrl`   string  A URL to the Terms of Service of the API
    * `contact` string  An email to be used for API-related correspondence
    * `license` string  The license name used for the API
    * `licenseUrl`  string  A URL to the license used for the API


### Response Object
HAPI allow you to define a response object for an API endpoint. The response object is used by HAPI to both validation and description the output of an API. It uses the same JOI validation objects to describe the input parameters. The plugin turns these object into visual description and examples in the Swagger UI.

An very simple example of the use of the response object:
```Javascript
var responseModel = Joi.object({
    equals: Joi.number(),
}).meta({
  className: 'Result'
});
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



### Error Status Codes
You can add HTTP error status codes to each of the endpoints. As HAPI routes don not directly have a property for error status codes so you need to add them the plugin configuration. The status codes need to be added as an array of objects with an error code and description:
```Javascript
config: {
    handler: handlers.add,
    description: 'Add',
    tags: ['api'],
    jsonp: 'callback',
    notes: ['Adds together two numbers and return the result'],
    plugins: {
        'hapi-swagger': {
            responseMessages: [
                { code: 400, message: 'Bad Request' },
                { code: 500, message: 'Internal Server Error'}
            ]
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
The plug-in has basic support for file uploads into your API's. Below is an example of a route with a file uplaod, the three important elements are: 

* `payloadType: 'form'` in the plugins section creates a form for upload
* `.meta({ swaggerType: 'file' })` add to the payload property you wish to be file upload
* `payload` cnfiguration how HAPI will process file
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
The  https://github.com/glennjones/be-more-hapi project has an example of file upload with the handler function dealing with validation, sch as filetype and schema validation.


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



### Mocha test
The project has a small number integration and unit tests. To run the test within the project type the following command.
```bash
$ mocha --reporter list
```
If you are considering sending a pull request please add tests for the functionality you add or change.


### Thanks
I would like to thank [Brandwatch](http://www.brandwatch.com/) who allow me to open this code up as part of the work on this plugin was done during a contract with them.

### Contributors
* jlewark (https://github.com/jlewark)
* ivorothschild (https://github.com/ivorothschild)
* Joshua McGinnis (https://github.com/joshua-mcginnis)
* David Waterston (https://github.com/davidwaterston)
* Jozz (https://github.com/jozzhart)
* John Oliva (https://github.com/joliva)
* thiagogalesi4e (https://github.com/thiagogalesi4e)
* HughePaul (https://github.com/HughePaul)
* Stefan Oderbolz (https://github.com/metaodi)
* Peter Henning (https://github.com/petreboy14)
* Timo Behrmann (https://github.com/z0mt3c)
* Darin Chambers (https://github.com/darinc)
* Kentaro Wakayama (https://github.com/kwakayama)
* John Brett (https://github.com/johnbrett)
* Felipe Leusin (https://github.com/felipeleusin)


### This is a work in progress
If you find any issue please file here on github and I will try and fix them.
