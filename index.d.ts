import { Plugin } from '@hapi/hapi';

declare module '@hapi/hapi' {
  // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/hapi__hapi/index.d.ts#L97
  interface PluginSpecificConfiguration {
    'hapi-swagger'?: {
      /**
       * How payload parameters are displayed `json` or `form`
       * @default 'json'
       */
      payloadType?: string;

      /**
       * Collection of example responses for each HTTP statuses
       */
      responses?: object;

      /**
       * The mime types consumed
       * @default ['application/json']
       */
      consumes?: string[];

      /**
       * The mime types produced
       * @default ['application/json']
       */
      produces?: string[];

      /**
       * The order in which endpoints are displayed, works with `options.sortEndpoints === ordered`
       */
      order?: number;

      /**
       * Whether a endpoint has been deprecated.
       * @default false
       */
      deprecated?: boolean;

      /**
       * Any property or object with a key starting with `x-*` is included in the swagger definition (similar to `x-*` options in the `info` object).
       */
      [key: string]: any;
    };
  }
}

declare namespace hapiswagger {
  type AuthOptions = object;

  type ExpandedType = 'none' | 'list' | 'full';

  type SortTagsType = 'alpha';

  type SortEndpointsType = 'alpaha' | 'method' | 'ordered';

  interface LicenseOptions {
    /**
     * The name of the license used for the API
     */
    name: string;
    /**
     * The URL to the license used by the API. MUST be formatted as a URL
     */
    url: string;
  }

  interface ContactOptions {
    /**
     * A contact name for the API
     */
    name?: string;

    /**
     * A URL pointing to the contact information. MUST be formatted as a URL
     */
    url?: string;

    /**
     * A email address of the contact person/organization. MUST be formatted as an email address.
     */
    email?: string;

    /**
     * Metadata about the license that describes how the API can be used.
     */
    license?: LicenseOptions;
  }

  interface InfoOptions {
    /**
     * The title of the application
     */
    title: string;

    /**
     * The version number of the API
     * @default '0.0.1'
     */
    version?: string;

    /**
     * A short description of the application
     */
    description?: string;

    /**
     * A URL to the Terms of Service of the API
     */
    termsOfService?: string;

    /**
     * Owner and license information about API.
     */
    contact?: ContactOptions;

    /**
     * Any property or object with a key starting with 'x-*' is included as such in the `info` section of the object returned by the JSON endpoint. This allows custom properties to be defined as options and copied as such.
     */
    [key: string]: any;
  }

  interface ExternalDocumentation {
    /**
     * A short description of the target documentation. GFM syntax can be used for rich text representation.
     */
    description?: string;

    /**
     * The URL for the target documentation. Value MUST be in the format of a URL.
     */
    string: string;
  }

  interface TagOptions {
    /**
     * The name of the tag.
     */
    name: string;

    /**
     * A short description for the tag. GFM syntax can be used for rich text representation.
     */
    description?: string;

    externalDocs?: ExternalDocumentation;
  }

  interface RegisterOptions {
    /**
     * The transfer protocol of the API ie `['http']`
     */
    schemes?: string[];

    /**
     * The host (name or IP) serving the API including port if any i.e. `localhost:8080`
     */
    host?: string;

    /**
     * Defines security strategy to use for plugin resources
     * @default false
     */
    auth?: string | boolean | AuthOptions;

    /**
     * Whether the swagger.json routes is severed with cors support
     * @default false
     */
    cors?: boolean;

    /**
     * The path of JSON endpoint that describes the API
     * @default '/swagger.json'
     */
    jsonPath?: string;

    /**
     * The path for the controller that serves the JSON that describes the API.If jsonPath is specified and this parameter is not, it will take jsonPath value.Useful when behind a reverse proxy
     * @default '/swagger.json'
     */
    jsonRoutePath?: string;

    /**
     * The base path from where the API starts i.e. `/v2/` (note, needs to start with `/`)
     * @default '/'
     */
    basePath?: string;

    /**
     * Selects what segment of the URL path is used to group endpoints
     * @default: 1
     */
    pathPrefixSize?: number;

    /**
     * Metadata about the API endpoints
     */
    info: InfoOptions;

    /**
     * Allows adding meta data to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag used there.
     */
    tags?: TagOptions[];

    /**
     * How to create grouping of endpoints value either `path` or `tags`
     * @default 'path'
     */
    grouping?: string;

    /**
     * A function used to determine which tags should be used for grouping (when `grouping` is set to `tags`)
     *
     * @remarks
     * @link https://swagger.io/specification/#tagObject
     *
     *
     * @param tag - String used to group API endpoint
     * @returns True or false
     *
     * @example
     * ```
     * (tag) => tag !== 'api'
     * ```
     */
    tagsGroupingFilter?(tag: string): boolean;

    /**
     * How payload parameters are displayed 'json' or 'form'
     * @default 'json'
     */
    payloadType?: string;

    /**
     * Add hapi tags to internal hapi-swagger routes
     * @default []
     */
    documentationRouteTags?: string | string[];

    /**
     * Add hapi plugins option to internal hapi-swagger routes
     * @default []
     */
    documentationRoutePlugins?: object;

    /**
     * The mime types consumed
     *
     * @default: 'application/json'
     */
    consumes?: string[];

    /**
     * The mime types produced
     *
     * @default 'application/json'
     */
    produces?: string[];

    /**
     * Adds JOI data that cannot be use directly by swagger as metadata
     *
     * @default true;
     */
    xProperties?: boolean;

    /**
     * Reuse of definition models to save space
     * @default: true
     */
    reuseDefinitions?: boolean;

    /**
     * Dynamic naming convention. `default` or `useLabel`
     *
     * @default 'default'
     */
    definitionPrefix?: string;

    /**
     * Dereferences JSON output
     *
     * @default: false
     */
    deReference?: boolean;

    /**
     * Validates the JSON output against swagger specification
     *
     * @default false
     */
    debug?: boolean;

    /**
     * Any property or object with a key starting with 'x-*' is included as such in the `info` section of the object returned by the JSON endpoint. This allows custom properties to be defined as options and copied as such.
     */
    [key: string]: any;

    //FIXME: https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/oauth2.md
    /**
     * Oauth configurations for swagger ui.
     */
    oauthOptions?: any;

    /**
     * Add files that support SwaggerUI. Only removes files if `documentationPage` is also set to false
     * @default: true
     */
    swaggerUI?: boolean;

    /**
     * The path of to all the SwaggerUI resources
     * @default: '/swaggerui/'
     */
    swaggerUIPath?: string;

    /**
     * The path to all the SwaggerUI assets endpoints.
     * If swaggerUIPath is specified and this parameter is not, it will take swaggerUIPath value. Useful when behind a reverse proxy
     * @default: '/swaggerui/'
     */
    routesBasePath?: string;

    /**
     * Add documentation page
     * @default true
     */
    documentationPage?: boolean;

    /**
     * The path of the documentation page
     * @default '/documentation'
     */
    documentationPath?: string;

    /**
     * The directory path used by `hapi-swagger` and `@hapi/vision` to resolve and load the templates to render `swagger-ui` interface. The directory must contain `index.html` and `debug.html` templates
     * @default: './templates'
     */
    templates?: string;

    /**
     * Controls the default expansion setting for the operations and tags. It can be 'list' (expands only the tags), 'full' (expands the tags and operations) or 'none' (expands nothing).
     *
     * @default 'list'
     */
    expanded?: ExpandedType;

    /**
     * Sort method for `tags` i.e. groups in UI.
     * @default: 'alpha'
     */
    sortTags?: SortTagsType;

    /**
     * Sort method for endpoints in UI. Values include `alpha`, `method`, `ordered`.
     * @default: 'alpha'
     */
    sortEndpoints?: SortEndpointsType;

    /**
     * A JavaScript string injected into the HTML, called when UI loads.
     * @default: null
     */
    uiCompleteScript?: string;

    /**
     * Sets the external validating URL Can switch off by setting to `null`
     * @default 'https://online.swagger.io/validator'
     */
    validatorUrl?: string;

    /**
     * Controls whether the "Try it out" section should be enabled by default
     * @default false
     */
    tryItOutEnabled?: boolean;
  }
}

declare const hapiswagger: Plugin<hapiswagger.RegisterOptions>;

export = hapiswagger;
