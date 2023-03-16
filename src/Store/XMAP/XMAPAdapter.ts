import { BaseAdapter } from '@jbrowse/core/data_adapters/BaseAdapter'
import { Region, SimpleFeature } from '@jbrowse/core/util'
import { openLocation } from '@jbrowse/core/util/io'
import {
  parseSMAPLine,
  parseXMapFeature,
  parseCMAPLine,
  XMapFeature,
  SMapFeature,
  CMapFeature,
} from '../util'

interface BareFeature {
  seq_id: string
  start: number
  [key: string]: unknown
}

interface RcFeature {
  refName: string
  start: number
  end: number
  type: string
  site_id: string
}

export default class XMAPAdapter extends BaseAdapter {
  molecule: unknown
  features: SimpleFeature[] = []
  referenceNames: Record<string, string> = {
    1: 'chr1',
    2: 'chr2',
    3: 'chr3',
    4: 'chr4',
    5: 'chr5',
    6: 'chr6',
    7: 'chr7',
    8: 'chr8',
    9: 'chr9',
    10: 'chr10',
    11: 'chr11',
    12: 'chr12',
    13: 'chr13',
    14: 'chr14',
    15: 'chr15',
    16: 'chr16',
    17: 'chr17',
    18: 'chr18',
    19: 'chr19',
    20: 'chr20',
    21: 'chr21',
    22: 'chr22',
    23: 'chrX',
    24: 'chrY',
  }

  getMolecule() {
    return this.molecule
  }

  refSeqs: Record<string, unknown> = {}
  rcBareFeatures: Record<string, Record<string, RcFeature>> = {}
  smapBareFeatures: Record<string, SMapFeature[]> = {}
  qcBareFeatures: Record<string, Record<string, CMapFeature>> = {}

  async _loadFeatures() {
    const data = await openLocation(this.getConf('qcmapLocation')).readFile(
      'utf8',
    )
    return data
      .split('\n')
      .filter(f => !!f)
      .filter(f => !f.startsWith('#'))
      .forEach(line => {
        const feature = parseCMAPLine(line)
        const { cmap_id, site_id } = feature
        if (!this.qcBareFeatures[cmap_id]) {
          this.qcBareFeatures[cmap_id] = {} as Record<string, CMapFeature>
        }
        this.qcBareFeatures[cmap_id][site_id] = feature
      })
  }

  async _smapParser() {
    const data = await openLocation(this.getConf('smapLocation')).readFile(
      'utf8',
    )
    return data
      .split('\n')
      .filter(f => !!f)
      .filter(f => !f.startsWith('#'))
      .forEach(line => {
        const feature = parseSMAPLine(line)

        //Store this information in a map as subfeatures.
        //// may not need below line CMD
        feature.seq_id = this.referenceNames[feature.seq_id]
        if (!this.smapBareFeatures[feature.seq_id]) {
          this.smapBareFeatures[feature.seq_id] = [] as SMapFeature[]
        }
        this.smapBareFeatures[feature.seq_id].push(feature)
      })
  }

  async _rcMapParser() {
    const data = await openLocation(this.getConf('rcmapLocation')).readFile(
      'utf8',
    )
    return data
      .split('\n')
      .filter(f => !!f)
      .filter(f => !f.startsWith('#'))
      .forEach(line => {
        const feature = parseCMAPLine(line)
        const { cmap_id, site_id } = feature
        if (!this.rcBareFeatures[cmap_id]) {
          this.rcBareFeatures[cmap_id] = {} as Record<string, RcFeature>
        }

        this.rcBareFeatures[cmap_id][site_id] = {
          refName: feature.cmap_id,
          start: +feature.position,
          end: +feature.position + 7,
          type: feature.label_channel,
          site_id: feature.site_id,
        }
      })
  }

  async _xMapParser() {
    const features = [] as { name: string }[]
    const featureMap = {} as Record<string, XMapFeature>
    const data = await openLocation(this.getConf('xmapLocation')).readFile(
      'utf8',
    )

    data
      .split('\n')
      .filter(f => !!f)
      .filter(f => !f.startsWith('#'))
      .forEach(line => {
        const feature = parseXMapFeature(line)
        if (!featureMap[feature.name]) {
          featureMap[feature.name] = feature
        }
        //Combine them
        const oldFeature = featureMap[feature.name]
        if (feature.Confidence >= oldFeature.Confidence) {
          featureMap[feature.name] = feature
          const f2 = this._labelData(feature)
          let map = f2.subfeatures[0].map
          let refSub = this.rcBareFeatures[f2.seq_id][map.ref]
          let start = 1
          while (!refSub && start < f2.subfeatures.length) {
            map = f2.subfeatures[start].map
            refSub = this.rcBareFeatures[f2.seq_id][map.ref]
            start++
          }
          const queSub = f2.subfeatures.find(f => f.name === map.query)

          if (refSub && queSub) {
            const plstart = +refSub.start
            const elt = this.qcBareFeatures[f2.name]

            if (f2.strand === '+') {
              f2.start = plstart - queSub.position // The query start is from the first label backwards.
              f2.end = f2.start + queSub.contig_length
              const matches = {} as Record<string, unknown>
              for (let i = 0; i < f2.subfeatures.length; i++) {
                matches[f2.subfeatures[i].name] = true
              }

              // @ts-expect-error
              f2.subfeatures = Object.values(elt).map(subf => {
                const start = f2.start + subf.position

                return {
                  refName: subf.seq_id,
                  name: subf.site_id,
                  type: matches[subf.site_id] ? subf.label_channel : 'nomatch',
                  start,
                  end: start + 7,
                }
              })
            } else {
              const startOffset =
                queSub.contig_length -
                elt['1'].position -
                elt[queSub.num_sites].position

              f2.start = plstart - startOffset
              f2.end = f2.start + queSub.contig_length
              const matches = {} as Record<string, boolean>
              for (let i = 0; i < f2.subfeatures.length; i++) {
                matches[f2.subfeatures[i].name] = true
              }

              // @ts-expect-error
              f2.subfeatures = Object.values(elt).map(subf => {
                const start = f2.start + startOffset + f2.qstart - subf.position

                return {
                  refName: subf.seq_id,
                  name: subf.site_id,
                  type: matches[subf.site_id] ? subf.label_channel : 'nomatch',
                  start,
                  end: start + 7,
                }
              })
            }
            for (let i = 0; features && i < features.length; i++) {
              if (features[i].name === f2.name) {
                features.splice(i)
              }
            }
            features.push(f2)
          } else {
            for (let i = 0; i < features.length; i++) {
              if (features[i].name === feature.name) {
                features.splice(i)
              }
            }
            features.push(feature)
          }
        }
      })
    return features
  }

  compareFeatureData(a: BareFeature, b: BareFeature) {
    if (a.seq_id < b.seq_id) {
      return -1
    } else if (a.seq_id > b.seq_id) {
      return 1
    } else {
      return a.start - b.start
    }
  }

  async _getFeatures(query: Region) {
    // fetch features CMD
    // search in this.features, which are sorted
    // by ref and start coordinate, to find the beginning of the
    // relevant range
    // fix CMD
    // observer.next(f)
  }

  _labelData(f: XMapFeature) {
    return {
      ...f,
      subfeatures: f.alignment
        .split(')')
        .map(alignment => {
          const tokens = alignment.substring(1).split(',')
          const ref = tokens[0]
          const query = tokens[1]
          const elt = this.qcBareFeatures[f.query_contig_id][query]

          let start = f.start
          if (f.strand === '-') {
            start = f.start + f.qstart - elt.position
          } else {
            if (f.qstart === elt.position) {
              start = f.start
            } else {
              start = elt.position + f.start
            }
          }
          return {
            seq_id: f.seq_id,
            position: elt.position,
            num_sites: elt.num_sites,
            contig_length: +elt.contig_length,
            name: elt.site_id,
            type: elt.label_channel,
            start,
            end: start + 7,
            strand: 0,
            id: query,
            map: { ref, query },
          }
        })
        .sort((a, b) => this.compareFeatureData(a, b)),
    }
  }

  freeResources() {}
}
