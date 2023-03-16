import { ConfigurationSchema } from '@jbrowse/core/configuration'

/**
 * #config BamAdapter
 * used to configure BAM adapter
 */
function x() {} // eslint-disable-line @typescript-eslint/no-unused-vars

const configSchema = ConfigurationSchema(
  'XMAPAdapter',
  {
    /**
     * #slot
     */
    xmapLocation: {
      type: 'fileLocation',
      defaultValue: { uri: '/path/to/my.xmap', locationType: 'UriLocation' },
    },

    /**
     * #slot
     */
    smapLocation: {
      type: 'fileLocation',
      defaultValue: { uri: '/path/to/my.smap', locationType: 'UriLocation' },
    },

    /**
     * #slot
     */
    rcmapLocation: {
      type: 'fileLocation',
      defaultValue: { uri: '/path/to/my.cmap', locationType: 'UriLocation' },
    },

    /**
     * #slot
     */
    qcmapLocation: {
      type: 'fileLocation',
      defaultValue: { uri: '/path/to/my.cmap', locationType: 'UriLocation' },
    },
  },
  { explicitlyTyped: true },
)

export default configSchema
