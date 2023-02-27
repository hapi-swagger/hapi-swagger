const Pack = require('../package.json');
const PluginRegistrationV2 = require('./pluginRegistration.js');


exports.plugin = {
  name: Pack.name,
  version: Pack.version,
  multiple: true,

  register: (server, options) => {

    const { OAS, ...otherOptions } = options;

    if (OAS === 'v3') {
      throw new Error('OpenAPI Specification v3 not implemented yet');
    }

    return PluginRegistrationV2(server, otherOptions);
  }
};

