# hapi-swagger


This is a [Swagger UI](https://github.com/wordnik/swagger-ui) plug-in for [HAPI](http://hapijs.com/) v6 or 7  When installed it will self document HTTP API interface in a project.


## Install

You can add the module to your HAPI using npm:

    $ npm install hapi-swagger --save,

    
## Adding the plug-in into your project

In the .js file where you create the HAPI `server` object add the following code after you have created the `server` object:

    var pack = require('../package'),
        options = {
            basePath: 'http://localhost:8000',
            apiVersion: pack.version
        };

    server.pack.register({
            plugin: require('hapi-swagger'), 
            options: swaggerOptions
        }, function (err) {
        if (err) {
            server.log(['error'], 'Plugin "hapi-swagger" load error: ' + err) 
        }else{
            server.log(['start'], 'Swagger interface loaded')
        }
    });


## Using the documentation page 
The plugin adds a page into your site with the route `/documentation`. This page contains Swaggers UI to allow users to explore your API. You can also build custom pages on your own URL paths if you wish, see: Adding custom interface into a page 


## Tagging your API routes
As a project may be a mixture of web pages and API endpoints you need to tag the routes you wish Swagger to document. Simply add the `tags: ['api']` property to the route object for any endpoint you want documenting.

You can even specify more tags and then later generate tag-specific documentation. If you specify `tags: ['api', 'foo']`, you can later use `/documentation?tags=foo` to load the documentation on the HTML page (see next section).


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
                    username: joi.number()
                            .required()
                            .description('the id for the todo item'),
                }
            }
        },
    }


    
## Adding interface into a page
The plugin adds all the resources needed to build the interface into your any page in your project. All you need to do is add some javascript into the header of a web page and add two elements into the HTML where you wish it to render. The example [be-more-hapi](https://github.com/glennjones/be-more-hapi) project makes use of a custom page where the interface is used with other elements.


### Adding the javascript

The doc directory and all the files in the URLs below are added by the plugin


    <link href='https://fonts.googleapis.com/css?family=Droid+Sans:400,700' rel='stylesheet' type='text/css'/>
    <link href='/docs/swaggerui/css/highlight.default.css' media='screen' rel='stylesheet' type='text/css'/>
    <link href='/docs/swaggerui/css/screen.css' media='screen' rel='stylesheet' type='text/css'/>
    <script src="/docs/swaggerui/lib/shred.bundle.js" type="text/javascript"></script>
    <script src='/docs/swaggerui/lib/jquery-1.8.0.min.js' type='text/javascript'></script>
    <script src='/docs/swaggerui/lib/jquery.slideto.min.js' type='text/javascript'></script>
    <script src='/docs/swaggerui/lib/jquery.wiggle.min.js' type='text/javascript'></script>
    <script src='/docs/swaggerui/lib/jquery.ba-bbq.min.js' type='text/javascript'></script>
    <script src='/docs/swaggerui/lib/handlebars-1.0.0.js' type='text/javascript'></script>
    <script src='/docs/swaggerui/lib/underscore-min.js' type='text/javascript'></script>
    <script src='/docs/swaggerui/lib/backbone-min.js' type='text/javascript'></script>
    <script src='/docs/swaggerui/lib/swagger.js' type='text/javascript'></script>
    <script src='/docs/swaggerui/swagger-ui.js' type='text/javascript'></script>
    <script src='/docs/swaggerui/lib/highlight.7.3.pack.js' type='text/javascript'></script>
    <script type="text/javascript">
      $(function () {
        window.swaggerUi = new SwaggerUi({
          url: window.location.protocol + '//' + window.location.host + '/docs',
          dom_id: "swagger-ui-container",
          supportedSubmitMethods: ['get', 'post', 'put', 'delete'],
          onComplete: function(swaggerApi, swaggerUi){
            log("Loaded SwaggerUI")
            $('pre code').each(function(i, e) {hljs.highlightBlock(e)});
          },
          onFailure: function(data) {
            log("Unable to Load SwaggerUI");
          },
          docExpansion: "list"
        });
        window.swaggerUi.load();
      });
    </script>

If you want to generate tag-specific documentation, you should change the URL from

    url: window.location.protocol + '//' + window.location.host + '/docs',

to:

    url: window.location.protocol + '//' + window.location.host + '/docs?tags=foo,bar,baz',

This will load all routes that have one or more of the given tags (`foo` or `bar` or `baz`). More complex use of tags include:

    ?tags=mountains,beach,horses
    this will show routes WITH 'mountains' OR 'beach' OR 'horses'

    ?tags=mountains,beach,+horses
    this will show routes WITH ('mountains' OR 'beach')  AND 'horses'

    ?tags=mountains,+beach,-horses
    this will show routes WITH 'mountains' AND 'beach' AND NO 'horses'

  
### Adding the HTML elements

Place the HTML code below into the body fo web page where you wish the interface to render

<pre>
&lt;section id=&quot;swagger&quot;&gt;
    &lt;h1 class=&quot;entry-title api-title&quot;&gt;API&lt;/h1&gt;
    &lt;div id=&quot;message-bar&quot; class=&quot;swagger-ui-wrap&quot;&gt;&lt;/div&gt;
    &lt;div id=&quot;swagger-ui-container&quot; class=&quot;swagger-ui-wrap&quot;&gt;&lt;/div&gt;
&lt;/section&gt;
</pre>


### Options
There are number of options for advance use case. In most case you should only have to provide the apiVersion and basePath.

* apiVersion: the version of your API 
* basePath: the base URL of the API i.e. 'http://localhost:3000'
* documentationPath: the path to the default documentation page - the default is: '/documentation',
* enableDocumentationPage: enable the display of the documentation page - the default is: true,
* endpoint: the JSON endpoint that descibes the API - the default is: '/docs'
* pathPrefixSize: selects what segment of the URL path is used to group endpoints - the default is: 1
* payloadType: weather accepts JSON or form parameters for payload - the default is: 'json'
* produces: an array of the output types from your API - the default is: ['application/json']



### Response Object
HAPI allow you to define a response object for an API endpoint. The response object is used by HAPI to both validation and description the output of an API. It uses the same JOI validation objects to describe the input parameters. The plugin turns these object into visual description and examples in the Swagger UI.

An very simple example of the use of the response object:

    var responseModel = hapi.types.object({
        equals: joi.number(),
    }).options({
      className: 'Result'
    });

    within you route object ...
    config: {
        handler: handlers.add,
        description: 'Add',
        tags: ['api'],
        notes: ['Adds together two numbers and return the result'],
        validate: { 
            params: {
                a: joi.number()
                    .required()
                    .description('the first number'),

                b: joi.number()
                    .required()
                    .description('the second number')
            }
        },
        response: {schema: responseModel}
    }


A working demo of more complex uses of response object can be found in the [be-more-hapi](https://github.com/glennjones/be-more-hapi) project.



### Error Status Codes
You can add HTTP error status codes to each of the endpoints. As HAPI routes don not directly have a property for error status codes so you need to add them the plugin configuration. The status codes need to be added as an array of objects with an error code and description:

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
                a: joi.number()
                    .required()
                    .description('the first number'),

                b: joi.number()
                    .required()
                    .description('the second number')
            }
        }
    }


### Headers and .unknown()
A common issue with the use of headers is that you may only want to validate some of the headers sent in a request and you are not concerned about other headers that maybe sent also. You can use JOI .unknown() to allow any all other headers to be sent without validation errors.

    validate: { 
        params: {
            a: joi.number()
                .required()
                .description('the first number'),

            b: joi.number()
                .required()
                .description('the second number')
        },
        headers: joi.object({
             'authorization': joi.string().required()
        }).unknown()
    }




### Mocha test
The project has a small number integration and unit tests. To run the test within the project type the following command.

    $ mocha --reporter list

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



