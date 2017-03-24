export default class CrowiPlugin {

  /**
   * process plugin entry
   *
   * @param {Crowi} crowi Crowi context class
   * @param {CrowiRenderer} crowiRenderer CrowiRenderer
   *
   * @memberof CrowiPlugin
   */
  installAll(crowi, crowiRenderer) {
    // import plugin definitions
    let definitions = [];
    try {
      definitions = require('../../tmp/plugins/plugin-definitions');
    }
    catch(e) {
      // TODO show warning
      // do nothing
      return;
    }

    definitions.forEach((definition) => {
      const meta = definition.meta;
      const entries = definition.entries;

      // v1 is deprecated

      // v2
      if (2 === meta.pluginSchemaVersion) {
        entries.forEach((entry) => {
          entry(crowi, crowiRenderer);
        });
      }
    });
  }

}

window.crowiPlugin = new CrowiPlugin();     // FIXME
