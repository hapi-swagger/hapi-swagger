# hapi-swagger

** THIS IS A WORK IN PROGRESS ** it will change

This is a [Swagger UI](https://github.com/wordnik/swagger-ui) plug-in for [HAPI](http://spumko.github.io/). When installed it will self document HTTP API interface in a project.


## Install

You need to add the module to your HAPI project by place the following line in the dependencies collection of the package.json file.

    "hapi-swagger": "git+ssh://git@github.com:glennjones/hapi-swagger.git",

    
## Adding the plug-in into your project

In the .js file where you create the HAPI `server` object add the following code

    var pack = require('../package'),
        swaggerOptions = {
            basePath: 'http://localhhost:8000',
            apiVersion: pack.version
        };

    server.pack.allow({ ext: true }).require('hapi-swagger', swaggerOptions, function (err) {
        if (!err && err !== null) {
            server.log(['error'], 'Plugin "hapi-swagger" load error: ' + err) 
        }else{
             server.log(['start'], 'swagger interface loaded')
        }
    });


## Tagging your API routes
As a project may be a mixture of web pages and API endpoints you need to tag the routes you wish Swagger to document. Simply add the `tags: ['api']` property to the route object for any endpoint you want documenting.


    {
        method: 'GET',
        path: '/todo/{id}/',
        config: {
            handler: handlers.mapUsername,
            description: 'Get todo',
            notes: 'Returns a todo item by the id passed in the path',
            tags: ['api'],        
            validate: { 
                path: {
                    username: hapi.types.String()
                            .required()
                            .description('the id for the todo item'),
                }
            }
        },
    }
    
   