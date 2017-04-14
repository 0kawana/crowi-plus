const debug = require('debug')('crowi:plugins:PluginService');
const PluginUtils = require('./plugin-utils');

class PluginService {

  constructor(crowi, app) {
    this.crowi = crowi;
    this.app = app;
    this.pluginUtils = new PluginUtils();
  }

  autoDetectAndLoadPlugins() {
    this.loadPlugins(this.pluginUtils.listPluginNames(this.crowi.rootDir));
  }

  /**
   * load plugins
   *
   * @memberOf PluginService
   */
  loadPlugins(pluginNames) {
    pluginNames
      .map((name) => {
        return this.pluginUtils.generatePluginDefinition(name);
      })
      .forEach((definition) => {
        this.loadPlugin(definition);
      });
  }

  loadPlugin(definition) {
    const meta = definition.meta;

    // v1 is deprecated
    if (1 === meta.pluginSchemaVersion) {
      debug('pluginSchemaVersion 1 is deprecated');
      return;
    }

    // v2
    if (2 === meta.pluginSchemaVersion) {
      debug(`load plugin '${definition.name}'`);

      definition.entries.forEach((entryPath) => {
        const entry = require(entryPath);
        entry(this.crowi, this.app);
      });
    }
  }
}

module.exports = PluginService;
