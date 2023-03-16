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

export function parseXMapLine(line: string) {
  var f = line.split('\t')

  return {
    xmap_entry_id: f[0],
    query_contig_id: f[1],
    refName: f[2],
    correctedRefName: 'scaffold_' + f[2],
    qstart: +f[3],
    qend: +f[4],
    start: +f[5],
    end: +f[6],
    strand: f[7],
    confidence: +f[8],
    hit_enum: f[9],
    CIGAR: f[9],
    qry_len: +f[10],
    ref_len: +f[11],
    label_channel: f[12],
    alignment: f[13],
    name: f[1],
  }
}

export function parseSMapLine(line: string) {
  var f = line.split('\t')

  return {
    smal_entry_id: f[0],
    qry_contig_id: f[1],
    ref_contig_id1: f[2],
    ref_contig_id2: f[3],
    qry_start_pos: f[4],
    qry_end_pos: f[5],
    ref_start_pos: f[6],
    ref_end_pos: f[7],
    confidence: +f[8],
    xmap_id1: f[10],
    xmap_id2: f[11],
    link_id: f[12],
    qey_start_idx: f[13],
    qry_end_idx: f[14],
    ref_start_idx: f[15],
    ref_end_idx: f[16],
    refName: f[2],
    start: +f[6],
    end: +f[7],
    type: f[9],
    id: 'SV_' + f[0],
  }
}

export function parseCMapLine(line: string) {
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

export type XMapFeature = ReturnType<typeof parseXMapLine>
export type SMapFeature = ReturnType<typeof parseSMapLine>
export type CMapFeature = ReturnType<typeof parseCMapLine>
