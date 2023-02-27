const Pack = require('../package.json');
const PluginRegistration = require('./pluginRegistration.js');


exports.plugin = {
  name: Pack.name,
  version: Pack.version,
  multiple: true,

  register: PluginRegistration
};

