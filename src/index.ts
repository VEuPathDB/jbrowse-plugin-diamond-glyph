import Plugin from '@jbrowse/core/Plugin'
import PluginManager from '@jbrowse/core/PluginManager'
import { version } from '../package.json'
import { createDiamondGlyph } from './DiamondGlyph'

export default class DiamondPlugin extends Plugin {
  name = 'DiamondPlugin'
  version = version

  install(pluginManager: PluginManager) {
    // Register the Diamond glyph
    pluginManager.addGlyphType(() => createDiamondGlyph(pluginManager))
  }

  configure(_pluginManager: PluginManager) {
    // Configuration hook - can be used to add menu items, etc.
  }
}
