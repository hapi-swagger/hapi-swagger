# hapi-swagger

This is a [OpenAPI (aka Swagger)](https://openapis.org/) plug-in for [Hapi](https://hapi.dev/) When installed it will self document the API interface
in a project.

[![Maintainers Wanted](https://img.shields.io/badge/maintainers-wanted-red.svg?style=for-the-badge)](https://github.com/glennjones/hapi-swagger/issues/718)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/glennjones/hapi-swagger/Node.js%20CI?style=for-the-badge)
[![npm downloads](https://img.shields.io/npm/dm/hapi-swagger.svg?style=for-the-badge)](https://www.npmjs.com/package/hapi-swagger)
[![MIT license](http://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](https://raw.github.com/glennjones/hapi-swagger/master/license.txt)

## Compatibility

| Version | [Hapi](https://github.com/hapijs/hapi) | [Joi](https://github.com/sideway/joi) | Node   | Release Notes                                                 |
| ------- | -------------------------------------- | ------------------------------------- | ------ | ------------------------------------------------------------- |
| `14.x`  | `>=19.0.0 @hapi/hapi`                  | `>=17.0.0 joi`                        | `>=12` | [#680](https://github.com/glennjones/hapi-swagger/issues/680) |
| `13.x`  | `>=19.0.0 @hapi/hapi`                  | `>=17.0.0 @hapi/joi`                  | `>=12` | [#660](https://github.com/glennjones/hapi-swagger/issues/660) |
| `12.x`  | `>=19.0.0 @hapi/hapi`                  | `>=17.0.0 @hapi/joi`                  | `>=12` | [#644](https://github.com/glennjones/hapi-swagger/issues/644) |
| `11.x`  | `>=18.4.0 @hapi/hapi`                  | `>=16.0.0 @hapi/joi`                  | `>=8`  | [#631](https://github.com/glennjones/hapi-swagger/issues/631) |
| `10.x`  | `>=18.3.1 @hapi/hapi`                  | `>=14.0.0 @hapi/joi`                  | `>=8`  | [#587](https://github.com/glennjones/hapi-swagger/issues/587) |
| `9.x`   | `>=17 hapi`                            | `<14.0.0`                             | `>=8`  | [#487](https://github.com/glennjones/hapi-swagger/issues/487) |
| `7.x`   | `<17 hapi`                             | ???                                   | ???    | [#325](https://github.com/glennjones/hapi-swagger/issues/325) |

## Installation

You can add the module to your Hapi using npm:

```bash
> npm install hapi-swagger --save
```

**hapi-swagger** no longer bundles `joi` to fix [#648](https://github.com/glennjones/hapi-swagger/issues/648). Install **hapi-swagger** with peer dependencies using:

```bash
npx install-peerdeps hapi-swagger
```

If you want to view the documentation from your API you will also need to install the `inert` and `vision` plugs-ins which support templates and static
content serving.

```bash
> npm install @hapi/inert --save
> npm install @hapi/vision --save
```

## Documentation

-   [Options Reference](optionsreference.md)
-   [Usage Guide](usageguide.md)

## Quick start

In your Hapi apps main JavaScript file add the following code to created a Hapi `server` object. You will also add the routes for you API as describe on hapijs.com site.

```Javascript
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');

(async () => {
    const server = await new Hapi.Server({
        host: 'localhost',
        port: 3000,
    });

    const swaggerOptions = {
        info: {
                title: 'Test API Documentation',
                version: Pack.version,
            },
        };

    await server.register([
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: swaggerOptions
        }
    ]);

    try {
        await server.start();
        console.log('Server running at:', server.info.uri);
    } catch(err) {
        console.log(err);
    }

    server.route(Routes);
})();
```

### Tagging your API routes

As a project may be a mixture of web pages and API endpoints you need to tag the routes you wish Swagger to
document. Simply add the `tags: ['api']` property to the route object for any endpoint you want documenting.

You can even specify more tags and then later generate tag-specific documentation. If you specify
`tags: ['api', 'foo']`, you can later use `/documentation?tags=foo` to load the documentation on the
HTML page (see next section).

```Javascript
{
    method: 'GET',
    path: '/todo/{id}/',
    options: {
        handler: handlers.getToDo,
        description: 'Get todo',
        notes: 'Returns a todo item by the id passed in the path',
        tags: ['api'], // ADD THIS TAG
        validate: {
            params: Joi.object({
                id : Joi.number()
                        .required()
                        .description('the id for the todo item'),
            })
        }
    },
}
```

Once you have tagged your routes start the application. **The plugin adds a page into your site with the route `/documentation`**,
so the the full URL for the above options would be `http://localhost:3000/documentation`.

### Typescript

**hapi-swagger** exports its own typescript definition file that can be used when registering the plugin with **Hapi**. See example below:

#### Install Typescript Definition Files

```sh
npm i @types/hapi__hapi @types/hapi__inert @types/hapi__joi @types/hapi__vision @types/node hapi-swagger --save-dev
```

#### Register Plugin with Typescript

```typescript
import * as Hapi from '@hapi/hapi';
import * as HapiSwagger from 'hapi-swagger';

// code omitted for brevity

const swaggerOptions: HapiSwagger.RegisterOptions = {
    info: {
        title: 'Test API Documentation'
    }
};

const plugins: Array<Hapi.ServerRegisterPluginObject<any>> = [
    {
        plugin: Inert
    },
    {
        plugin: Vision
    },
    {
        plugin: HapiSwagger,
        options: swaggerOptions
    }
];

await server.register(plugins);
```

## Contributing

Read the [contributing guidelines](./.github/CONTRIBUTING.md) for details.

## Thanks

I would like to thank all that have contributed to the project over the last couple of years. This is a hard project to maintain, getting Hapi to work with Swagger is like putting a round plug in a square hole. Without the help of others it would not be possible.
