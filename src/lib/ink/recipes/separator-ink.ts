import { line, RULER } from '@/lib/ink/shapes'
import { defineRecipe } from '@/lib/ink/recipes'
import type { Line, Pt } from '@/lib/ink/types'

export const separatorVariantList = ['pencil', 'dashed', 'wavy', 'dotted', 'tape', 'stitched', 'torn'] as const
export type SeparatorVariant = (typeof separatorVariantList)[number]

export interface SeparatorParams {
  variant: SeparatorVariant
  orientation: 'horizontal' | 'vertical'
}

export const separatorRecipe = defineRecipe<SeparatorParams>({
  id: 'separator',
  kind: 'rule',
  layers: ['rest'],
  pad: 12,
  draw(ink, { w, h }, { variant, orientation }, ctx) {
    const vertical = orientation === 'vertical'
    const L = vertical ? h : w
    const c = (vertical ? w : h) / 2
    const at = (t: number, u = 0): Pt => (vertical ? [c + u, t] : [t, c + u])
    ink.layer('rest', () => {
      if (variant === 'dashed') {
        ink.lines(dashes(L, at), 'pencil', { width: 1.35 })
        return
      }
      const [x1, y1] = at(0)
      const [x2, y2] = at(L)
      line(ink, x1, y1, x2, y2, { pen: ctx.calm ? 'pencil.fine' : 'pencil' })
    })
  },
})

function dashes(L: number, at: (t: number, u?: number) => Pt): Line[] {
  const gap = 5
  const count = Math.max(1, Math.round((L + gap) / 17))
  const step = (L + gap) / count
  const out: Line[] = []
  for (let i = 0; i < count; i++) out.push({ pts: [at(i * step), at(i * step + step - gap)], o: RULER })
  return out
}
