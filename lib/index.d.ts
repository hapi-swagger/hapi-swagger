import { Plugin } from '@hapi/hapi';
import { boolean } from '@hapi/joi';

declare namespace hapiswagger {
  interface InfoOptions {
    title?: string;
  }

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
     * containing array of [Tag Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#tagObject) used to group endpoints in UI. No defaults are provided.
     */
    tags?: TagOption[];

    /**
     * How to create grouping of endpoints value either `path` or `tags`
     * @default 'path'
     */
    grouping?: string;

    /**
     * A function used to determine which tags should be used for grouping (when `grouping` is set to `tags`)
     * @param tag
     */
    tagsGroupingFilter?(tag: string): boolean;
  }
}

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
   *  The title of the application
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
   * Any property or object with a key starting with _x-_ is included as such in the _info_ section
   * of the object returned by the JSON endpoint. This allows custom properties to be defined as options and
   * copied as such.
   */
  'x-option': any;
};

type ContactOptions = {
  /**
   *  A contact name for the API
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

declare const hapiswagger: Plugin<HapiSwagger.Options>;

export = HapiSwagger;
