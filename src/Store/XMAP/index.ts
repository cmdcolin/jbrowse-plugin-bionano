import PluginManager from '@jbrowse/core/PluginManager'
import AdapterType from '@jbrowse/core/pluggableElementTypes/AdapterType'
import configSchema from './configSchema'
import AdapterClass from './XMAPAdapter'

export default (pluginManager: PluginManager) => {
  pluginManager.addAdapterType(() => {
    return new AdapterType({
      name: 'XMAPAdapter',
      displayName: 'XMAP adapter',
      configSchema,
      AdapterClass,
    })
  })
}
