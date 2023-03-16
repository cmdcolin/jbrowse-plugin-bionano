import { BaseFeatureDataAdapter } from '@jbrowse/core/data_adapters/BaseAdapter'
import {
  doesIntersect2,
  Feature,
  Region,
  SimpleFeature,
} from '@jbrowse/core/util'
import { openLocation } from '@jbrowse/core/util/io'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import {
  parseSMapLine,
  parseXMapLine,
  parseCMapLine,
  XMapFeature,
  SMapFeature,
  CMapFeature,
} from '../util'
import { cigarToMismatches, parseCigar } from './util'

interface BareFeature {
  refName: string
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

type QCMap = Record<string, Record<string, CMapFeature>>

export default class XMAPAdapter extends BaseFeatureDataAdapter {
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

  refSeqs: Record<string, unknown> = {}
  p?: Promise<any>

  async loadQCMap() {
    const data = await openLocation(this.getConf('qcmapLocation')).readFile(
      'utf8',
    )
    const qcMap: QCMap = {}
    data
      .split('\n')
      .filter(f => !!f && !f.startsWith('#'))
      .forEach(line => {
        const feature = parseCMapLine(line)
        const { cmap_id, site_id } = feature
        if (!qcMap[cmap_id]) {
          qcMap[cmap_id] = {} as Record<string, CMapFeature>
        }
        qcMap[cmap_id][site_id] = feature
      })
    return qcMap
  }

  async loadSMap() {
    const data = await openLocation(this.getConf('smapLocation')).readFile(
      'utf8',
    )
    const smapBareFeatures: Record<string, SMapFeature[]> = {}
    data
      .split('\n')
      .filter(f => !!f)
      .filter(f => !f.startsWith('#'))
      .forEach(line => {
        const feature = parseSMapLine(line)

        //Store this information in a map as subfeatures.
        //// may not need below line CMD
        feature.refName = this.referenceNames[feature.refName]
        if (!smapBareFeatures[feature.refName]) {
          smapBareFeatures[feature.refName] = [] as SMapFeature[]
        }
        smapBareFeatures[feature.refName].push(feature)
      })
    return smapBareFeatures
  }

  async loadRCMap() {
    const data = await openLocation(this.getConf('rcmapLocation')).readFile(
      'utf8',
    )
    const rcMap: Record<string, Record<string, RcFeature>> = {}
    data
      .split('\n')
      .filter(f => !!f && !f.startsWith('#'))
      .forEach(line => {
        const feature = parseCMapLine(line)
        const { cmap_id, site_id } = feature
        if (!rcMap[cmap_id]) {
          rcMap[cmap_id] = {} as Record<string, RcFeature>
        }

        rcMap[cmap_id][site_id] = {
          refName: feature.cmap_id,
          start: +feature.position,
          end: +feature.position + 7,
          type: feature.label_channel,
          site_id: feature.site_id,
        }
      })
    return rcMap
  }

  async parseXMapPre() {
    const features = [] as { name: string }[]
    const featureMap = {} as Record<string, XMapFeature>
    const data = await openLocation(this.getConf('xmapLocation')).readFile(
      'utf8',
    )
    const qcMap = await this.loadQCMap()
    const rcMap = await this.loadRCMap()
    data
      .split('\n')
      .filter(f => !!f)
      .filter(f => !f.startsWith('#'))
      .forEach(line => {
        const feature = parseXMapLine(line)
        features.push(feature)
        // if (!featureMap[feature.name]) {
        //   featureMap[feature.name] = feature
        // }
        //Combine them
        // const oldFeature = featureMap[feature.name]
        // if (feature.confidence >= oldFeature.confidence) {
        //   featureMap[feature.name] = feature
        //   const f2 = this._labelData(feature, qcMap)
        //   let map = f2.subfeatures[0].map
        //   let refSub = rcMap[f2.refName][map.ref]
        //   let start = 1
        //   while (!refSub && start < f2.subfeatures.length) {
        //     map = f2.subfeatures[start].map
        //     refSub = rcMap[f2.refName][map.ref]
        //     start++
        //   }
        //   const queSub = f2.subfeatures.find(f => f.name === map.query)

        //   if (refSub && queSub) {
        //     const plstart = +refSub.start
        //     const elt = qcMap[f2.name]

        //     if (f2.strand === '+') {
        //       // The query start is from the first label backwards.
        //       f2.start = plstart - queSub.position
        //       f2.end = f2.start + queSub.contig_length
        //       const matches = {} as Record<string, unknown>
        //       for (let i = 0; i < f2.subfeatures.length; i++) {
        //         matches[f2.subfeatures[i].name] = true
        //       }

        //       f2.subfeatures = []
        //       Object.values(elt).map(subf => {
        //         const start = f2.start + subf.position

        //         return {
        //           // @ts-expect-error
        //           refName: subf.refName,
        //           name: subf.site_id,
        //           type: matches[subf.site_id] ? subf.label_channel : 'nomatch',
        //           start,
        //           end: start + 7,
        //         }
        //       })
        //     } else {
        //       const startOffset =
        //         queSub.contig_length -
        //         elt['1'].position -
        //         elt[queSub.num_sites].position

        //       f2.start = plstart - startOffset
        //       f2.end = f2.start + queSub.contig_length
        //       const matches = {} as Record<string, boolean>
        //       for (let i = 0; i < f2.subfeatures.length; i++) {
        //         matches[f2.subfeatures[i].name] = true
        //       }

        //       f2.subfeatures = []
        //       Object.values(elt).map(subf => {
        //         const start = f2.start + startOffset + f2.qstart - subf.position

        //         return {
        //           // @ts-expect-error
        //           refName: subf.refName,
        //           name: subf.site_id,
        //           type: matches[subf.site_id] ? subf.label_channel : 'nomatch',
        //           start,
        //           end: start + 7,
        //         }
        //       })
        //     }
        //   }
        // const idx = features.findIndex(f => f.name === f2.name)
        // if (idx !== -1) {
        //   features.splice(idx, 1, f2)
        // } else {
        //   features.push(f2)
        // }
        // }
      })
    return features
  }

  async parseXMap() {
    if (!this.p) {
      this.p = this.parseXMapPre().catch(e => {
        this.p = undefined
        throw e
      })
    }
    return this.p
  }

  compareFeatureData(a: BareFeature, b: BareFeature) {
    if (a.refName < b.refName) {
      return -1
    } else if (a.refName > b.refName) {
      return 1
    } else {
      return a.start - b.start
    }
  }

  async getRefNames() {
    const features = await this.parseXMap()
    return [...new Set<string>(features.map((f: any) => f.correctedRefName))]
  }

  getFeatures(region: Region & { originalRefName?: string }) {
    return ObservableCreate<Feature>(async observer => {
      const features = await this.parseXMap()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      features.forEach((data: any, i: any) => {
        if (
          data.correctedRefName === region.refName &&
          doesIntersect2(data.start, data.end, region.start, region.end)
        ) {
          observer.next(
            new SimpleFeature({
              data: {
                ...data,
                mismatches: cigarToMismatches(parseCigar(data.CIGAR)),
              },
              id: `${this.id}_map_${i}`,
            }),
          )
        }
      })
      observer.complete()
    })
  }

  _labelData(f: XMapFeature, qcMap: QCMap) {
    return {
      ...f,
      // matchAll is reasonably fast https://jsperf.app/zavake/1/preview
      subfeatures: [...f.alignment.matchAll(/\(([0-9]+),([0-9]+)\)/g)]
        .map(([, ref, query]) => {
          const elt = qcMap[f.query_contig_id][query]
          if (!elt) {
            console.log({ query, contig_id: f.query_contig_id })
            throw new Error('wow')
          }

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
            refName: f.refName,
            position: elt.position,
            num_sites: elt.num_sites,
            contig_length: elt.contig_length,
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
