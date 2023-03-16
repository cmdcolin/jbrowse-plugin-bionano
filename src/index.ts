import Plugin from '@jbrowse/core/Plugin'
import PluginManager from '@jbrowse/core/PluginManager'
import { version } from '../package.json'
import XMAPAdapterF from './Store/XMAP'

export default class BioNanoPlugin extends Plugin {
  name = 'BioNanoPlugin'
  version = version

  install(pluginManager: PluginManager) {
    console.log('t1')
    XMAPAdapterF(pluginManager)
  }
}
