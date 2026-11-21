import { highlight, wash } from '@/lib/ink/fills'
import { roundRectPoly } from '@/lib/ink/geom'
import type { PaintKey } from '@/lib/ink/paint'
import { defineRecipe } from '@/lib/ink/recipes'
import { box, chain, focusRing } from '@/lib/ink/shapes'
import type { PenName } from '@/lib/ink/types'

export type AccordionTone = 'hi' | 'sky' | 'grass' | 'marker' | 'bubblegum'

export interface AccordionBoxParams {
  tone?: AccordionTone
}

const PEN_OF: Record<AccordionTone, PenName> = {
  hi: 'hi',
  sky: 'm_sky',
  grass: 'm_grass',
  marker: 'terracotta',
  bubblegum: 'm_bubblegum',
}

export const accordionBoxRecipe = defineRecipe<AccordionBoxParams>({
  id: 'accordion-box',
  kind: 'accordion',
  layers: ['rest', 'hover', 'open', 'focus'],
  lazy: ['focus'],
  pad: 10,
  draw(ink, { w, h }, { tone = 'hi' }, ctx) {
    const r = 6
    const calm = ctx.calm
    const body = roundRectPoly(1, 1, Math.max(8, w - 2), Math.max(8, h - 2), r)
    const accent: PaintKey = tone

    ctx.lazy('focus', (fink) => focusRing(fink, 0, 0, w, h, { r }))
    if (ctx.lazyOnly) return

    ink.layer('rest', () => {
      ink.poly('under', body, 'slip', 0.96)
      box(ink, 0.5, 0.5, Math.max(6, w - 1), Math.max(6, h - 1), {
        pen: calm ? 'pencil.fine' : 'ink.fine',
        corner: r,
        loose: calm ? 0.45 : 0.85,
        opts: { width: calm ? 1.15 : 1.4 },
      })
    })

    ink.layer('hover', () => {
      wash(ink, body, accent, { alpha: 0.16 })
      if (!calm) {
        box(ink, 1, 1, Math.max(6, w - 2), Math.max(6, h - 2), {
          pen: 'pencil.fine',
          corner: r,
          loose: 0.6,
          opts: { alpha: 0.55 },
        })
      }
    })

    ink.layer('open', () => {
      highlight(ink, 6, 6, Math.max(12, w - 12), 20, {
        k: 0.72,
        pen: PEN_OF[tone],
        opts: { alpha: 0.34 },
      })
      const d = 3.2
      ink.lines(
        [
          {
            pts: chain([[r + d + 2, h + d], [w + d, h + d], [w + d, r + d + 2]], [0.2, -0.15], 4, ink.next('drop')),
            o: { start: 'soft', end: 'soft', wobble: 0.25, dry: 0 },
          },
        ],
        'ink',
        { width: 1.7 },
      )
    })
  },
})
