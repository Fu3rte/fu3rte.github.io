import { defineRecipe } from '@/lib/ink/recipes'
import type { Pt } from '@/lib/ink/types'

export type PolaroidScene = 'hills' | 'sea' | 'house' | 'night'
export const POLAROID_SCENES: readonly PolaroidScene[] = ['hills', 'sea', 'house', 'night']

export interface PolaroidPhotoParams {
  scene: PolaroidScene
}

export function crescent(_cx: number, _cy: number, _R: number, _bx: number, _by: number, _r2: number, _n = 14): Pt[] {
  return []
}

export const polaroidPhotoRecipe = defineRecipe<PolaroidPhotoParams>({
  id: 'polaroid-photo',
  kind: 'photo',
  layers: ['rest'],
  pad: 4,
  draw() {},
})
