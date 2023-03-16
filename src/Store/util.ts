// var xmap_field_names =
//   'XmapEntryID QryContigID RefContigID QryStartPos QryEndPos RefStartPos RefEndPos Orientation Confidence HitEnum QryLen RefLen LabelChannel Alignment'.split(
//     ' ',
//   )

// export interface XMapFeature {
//   XmapEntryID: string
//   QryContigID: string
//   RefContigID: string
//   QryStartPos: string
//   QryEndPos: string
//   RefStartPos: string
//   RefEndPos: string
//   Orientation: string
//   Confidence: string
//   HitEnum: string
//   QryLen: string
//   RefLen: string
//   LabelChannel: string
//   Alignment: string
// }

export function parseXMapFeature(line: string) {
  var f = line.split('\t')

  return {
    seq_id: f[2],
    query_contig_id: f[1],
    type: 'QueryContig',
    qstart: +f[3],
    qend: +f[4],
    start: +f[5],
    end: +f[6],
    score: null,
    phase: 0,
    strand: f[7],
    Confidence: +f[8],
    alignment: f[13],
    name: f[1],
    attributes: { ID: [f[1]] },
  }
}

export type XMapFeature = ReturnType<typeof parseXMapFeature>

var smap_field_names =
  'SmapEntryID QryContigID RefcontigID1 RefcontigID2 QryStartPos QryEndPos RefStartPos RefEndPos Confidence Type XmapID1 XmapID2 LinkID QryStartIdx QryEndIdx RefStartIdx RefEndIdx'.split(
    ' ',
  )

export interface SMapFeature {
  SmapEntryID: string
  QryContigID: string
  RefcontigID1: string
  RefcontigID2: string
  QryStartPos: string
  QryEndPos: string
  RefStartPos: string
  RefEndPos: string
  Confidence: string
  Type: string
  XmapID1: string
  XmapID2: string
  LinkID: string
  QryStartIdx: string
  QryEndIdx: string
  RefStartIdx: string
  RefEndIdx: string
  seq_id: string
  start: number
  end: number
  type: string
  attributes: { ID: string }
}

export function parseSMAPLine(line: string) {
  var f = line.split('\t')
  var parsed = {} as Record<string, any>
  for (var i = 0; i < smap_field_names.length; i++) {
    parsed[smap_field_names[i]] = f[i]
  }
  parsed.seq_id = f[2]
  parsed.start = parseInt(f[6])
  parsed.end = parseInt(f[7])
  parsed.type = f[9]
  parsed.attributes = { ID: ['SV_' + f[0]] }

  return parsed as SMapFeature
}
// var cmap_field_names =
//   'cmap_id contig_length num_sites site_id label_channel position std_dev coverage occurence'.split(
//     ' ',
//   )

export interface CMapFeature {
  cmap_id: string
  contig_length: number
  num_sites: number
  site_id: string
  label_channel: string
  position: number
  std_dev: number
  coverage: number
  occurence: number
}
export function parseCMAPLine(line: string): CMapFeature {
  var f = line.split('\t')

  return {
    cmap_id: f[0],
    contig_length: +f[1],
    num_sites: +f[2],
    site_id: f[3],
    label_channel: f[4],
    position: +f[5],
    std_dev: +f[6],
    coverage: +f[7],
    occurence: +f[8],
  }
}
