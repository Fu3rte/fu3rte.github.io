export type GrainMaskKind = 'felt' | 'marker' | 'graphite' | 'waxy' | 'stamp'

export interface GrainTile {
  uri: string
  size: number
  density: number
  css: number
  bytes: number
  mean: number
}

export const GRAIN_TILES: Record<GrainMaskKind, GrainTile> = {
  felt: {
    uri: '',
    size: 224,
    density: 2,
    css: 112,
    bytes: 14622,
    mean: 0.897,
  },
  marker: {
    uri: '',
    size: 256,
    density: 2,
    css: 128,
    bytes: 19041,
    mean: 0.932,
  },
  graphite: {
    uri: '',
    size: 224,
    density: 2,
    css: 112,
    bytes: 13207,
    mean: 0.866,
  },
  waxy: {
    uri: '',
    size: 224,
    density: 2,
    css: 112,
    bytes: 10023,
    mean: 0.931,
  },
  stamp: {
    uri: '',
    size: 320,
    density: 2,
    css: 160,
    bytes: 12359,
    mean: 0.928,
  },
}
