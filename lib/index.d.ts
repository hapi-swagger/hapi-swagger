import { Plugin, RouteOptions } from '@hapi/hapi';

declare module '@hapi/hapi' {
  // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/hapi__hapi/index.d.ts#L97
  interface PluginSpecificConfiguration {
    hapiswagger?: {
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
    };
  }
}

declare namespace hapiswagger {
  type SecurityDefinition = {
    [key: string]: SecurityDefinitionOption;
  };

  type SecurityDefinitionOption = {
    /**
     * The type of the security scheme. Valid values are "basic", "apiKey" or "oauth2".
     */
    type: string;

    /**
     * A short description for security scheme.
     */
    description?: string;

    /**
     * The name of the header or query parameter to be used.
     */
    name: string;

    /**
     * The location of the API key. Valid values are "query" or "header".
     */
    in: string;

    /**
     * The flow used by the OAuth2 security scheme. Valid values are "implicit", "password", "application" or "accessCode".
     */
    flow: string;

    /**
     * The authorization URL to be used for this flow. This SHOULD be in the form of a URL.
     */
    authorizationUrl: string;

    /**
     * The token URL to be used for this flow. This SHOULD be in the form of a URL.
     */
    tokenUrl: string;

    /**
     * The available scopes for the OAuth2 security scheme.
     */
    scopes: ScopeObject;
  };

  type ScopeObject = {
    [key: string]: ScopeObjectOptions;
  };

  type ScopeObjectOptions = {
    /**
     * Maps between a name of a scope to a short description of it (as the value of the property).
     * @example
     * ```
     * {
     *  "write:pets": "modify pets in your account",
     *  "read:pets": "read your pets"
     * }
      ```
     */
    [key: string]: string;
  };

  type TagOption = {
    /**
     * The name of the tag.
     */
    name: string;
    /**
     * A short description for the tag. GFM syntax can be used for rich text representation.
     */
    description?: string;

    /**
     * Additional external documentation for this tag.
     */
    externalDocs: ExternalOption;
  };

  type ExternalOption = {
    /**
     * A short description of the target documentation. GFM syntax can be used for rich text representation.
     */
    description?: string;

    /**
     * The URL for the target documentation. Value MUST be in the format of a URL.
     */
    url: string;
  };

  type PathReplacementOptions = {
    replaceIn: string;
    pattern: RegExp;
    replacement: string;
  };

  type InfoOptions = {
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
    description: string;

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
  };

  type ContactOptions = {
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
  };

  type LicenseOptions = {
    /**
     * The name of the license used for the API
     */
    name: string;
    /**
     * The URL to the license used by the API. MUST be formatted as a URL
     */
    url: string;
  };

  type AuthOptions = object;
  interface Options {
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
     * The path of JSON endpoint at describes the API
     * @default '/swagger.json'
     */
    jsonPath?: string;

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
     * Methods for modifying path and group names in documentation
     * @default []
     */
    pathReplacements?: PathReplacementOptions[];

    /**
     * Metadata about the API endpoints
     */
    info: InfoOptions;

    /**
     * Containing array of [Tag Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#tagObject) used to group endpoints in UI. No defaults are provided.
     */
    tags?: TagOption[];

    /**
     * How to create grouping of endpoints value either `path` or `tags`
     * @default 'path'
     */
    grouping?: string;

    /**
     * A function used to determine which tags should be used for grouping (when `grouping` is set to `tags`)
     * @example
     * ```
     * (tag) => tag !== 'api'
     * ```
     */
    tagsGroupingFilter?(tag: string): boolean;

    /**
     * Containing Security Definitions Object. No defaults are provided.
     * @link [Security Definitions Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityDefinitionsObject)
     */
    securityDefinitions: SecurityDefinition;

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
     * The mime types consumed
     * @default: 'application/json'
     */
    consumes?: string[];

    /**
     * The mime types produced
     * @default 'application/json'
     */
    produces?: string[];

    /**
     * Adds JOI data that cannot be use directly by swagger as metadata
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
     * @default 'default'
     */
    definitionPrefix?: string;

    /**
     * Dereferences JSON output
     * @default: false
     */
    deReference?: boolean;

    /**
     * Validates the JSON output against swagger specification
     * @default false
     */
    debug?: boolean;

    /**
     * Any property or object with a key starting with 'x-*' is included as such in the `info` section of the object returned by the JSON endpoint. This allows custom properties to be defined as options and copied as such.
     */
    [key: string]: any;

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
     * Sort method for `tags` i.e. groups in UI.
     * @default: 'alpha'
     */
    sortTags?: string;

    /**
     * Sort method for endpoints in UI. Values include `alpha`, `method`, `ordered`.
     * @default: 'alpha'
     */
    sortEndpoints?: string;

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
  }
}

declare const HapiSwagger: Plugin<hapiswagger.Options>;

export = HapiSwagger;
