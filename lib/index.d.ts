import { Plugin } from '@hapi/hapi';

declare namespace HapiSwagger {
  interface Options {
    /**
     * The transfer protocol of the API ie `['http']`
     */
    schemes?: string[];

    /**
     * he host (name or IP) serving the API including port if any i.e. `localhost:8080`
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
     */
    jsonPath?: string;
  }
}

type AuthOptions = object;

declare var HapiSwagger: Plugin<HapiSwagger.Options>;

export = HapiSwagger;
