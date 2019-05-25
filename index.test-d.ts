import { Server } from '@hapi/hapi';
import * as hapiswagger from '.';

(async () => {
  const server = new Server({ debug: false, port: 0 });

  server.register({
    plugin: hapiswagger,
    options: {
      cors: true,
      jsonPath: '/jsonpath',
      info: {
        title: 'a',
        description: 'b',
        termsOfService: 'c',
        contact: {
          name: 'a',
          url: 'localhost',
          email: 'who@where.com'
        }
      },
      tagsGroupFilter: (tag: string) => tag !== 'api'
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: () => 'hi',
    options: {
      auth: false,
      plugins: {
        'hapi-swagger': {
          order: 2,
          deprecated: false,
          'x-api-stuff': 'a'
        }
      }
    }
  });

  await server.start();
  await server.stop();
})();
