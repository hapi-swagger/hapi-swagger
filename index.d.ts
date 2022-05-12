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

  type SortEndpointsType = 'alpha' | 'method' | 'ordered';

  type UiCompleteScriptObjectType = {
    src: string;
  }

  type UiCompleteScriptType = string | UiCompleteScriptObjectType

  type ScopesType = {
    [scope: string]: string | any;
  }

  type SecuritySchemeType = {
    /**
     * The authorization URL to be used for this flow. This SHOULD be in the form of a URL. REQUIRED for `type` "oauth2", and `flow` "implicit" or "accessCode"
     */
    authorizationUrl?: string;

    /**
     * A short description for security scheme.
     */
    description?: string;

    /**
     * The flow used by the OAuth2 security scheme. Valid values are "implicit", "password", "application" or "accessCode". REQUIRED for `type` "oauth2"
     */
    flow?: string;

    /**
     * The location of the API key. Valid values are "query" or "header". REQUIRED for `type` "apiKey"
     */
    in?: string;

    /**
     * The name of the header or query parameter to be used. REQUIRED for `type` "apiKey"
     */
    name?: string;

    /**
     * The available scopes for the OAuth2 security scheme. REQUIRED for `type` "oauth2"
     */
    scopes?: ScopesType;

    /**
     * The token URL to be used for this flow. This SHOULD be in the form of a URL. REQUIRED for `type` "oauth2", and `flow` "password", "application", or "accessCode"
     */
    tokenUrl?: string;

    /**
     * The type of the security scheme. Valid values are "basic", "apiKey" or "oauth2"
     */
    type: string;

    /**
     * Any property or object with a key starting with `x-*` is included in the Swagger definition (similar to `x-*` options in the `info` object)
     */
    [key: string]: any;
  }

  /**
   * Lists the required security schemes to execute this operation. The object can have multiple security schemes declared in it which are all required (that is, there is a logical AND between the schemes)
   *
   * The name used for each property MUST correspond to a security scheme declared in the {@link RegisterOptions.securityDefinitions}
   *
   * If the security scheme is of `type` "oauth2", then the value is a list of scope names required for the execution. For other security scheme types, the array MUST be empty
   */
  type SecurityRequirementsType = {
    [securityDefinitionName: string]: string[];
  };

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

    /** Allows filtering the routes included into Swagger docs by tag or function
     * @default 'api'
     *
     * @example
     * ```
     * (tags) => !tags.includes('private')
     * ```
     */
    routeTag?: string | ((tags: string[]) => boolean)

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

    // TODO: remove below line after adding all option typings to this file
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
    uiCompleteScript?: UiCompleteScriptType;

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

    /**
     * A declaration of the security schemes available to be used in the specification. This does not enforce the security schemes on the operations and only serves to provide the relevant details for each scheme
     */
    securityDefinitions?: { [name: string]: SecuritySchemeType };

    /**
     * A declaration of which security schemes are applied for the API as a whole. The list of values describes alternative security schemes that can be used (that is, there is a logical OR between the security requirements)
     */
    security?: [SecurityRequirementsType];
  }
}

declare const hapiswagger: Plugin<hapiswagger.RegisterOptions>;

export = hapiswagger;
