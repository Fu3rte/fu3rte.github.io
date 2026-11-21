import type { Line, Material, PenName, PenSpec, Pt, StrokeOpts } from '@/lib/ink/types'
import type { Ink } from '@/lib/ink/builder'
import type { PaintKey } from '@/lib/ink/paint'
import { clamp, type Rng } from '@/lib/ink/rng'
import { noise1 } from '@/lib/ink/noise'
import { area, bboxOf, centroid, densifyClosed, offsetPoly, scanSpans, wobblePoly } from '@/lib/ink/geom'
import { pen as resolvePen } from '@/lib/ink/pens'

export interface Offset {
  dx: number
  dy: number
}

const shiftOf = (from: Pt[], to: Pt[]): Offset => {
  const a = centroid(from), b = centroid(to)
  return { dx: b[0] - a[0], dy: b[1] - a[1] }
}

function laid(_ink: Ink, poly: Pt[], _mis: number | false | undefined, _salt = 'mr'): Pt[] {
  return poly
}

export function rough(poly: Pt[], rng: Rng, amt = 0.8, step = 4): Pt[] {
  const pts = densifyClosed(poly, step)
  let per = 0
  for (let i = 0; i < pts.length; i++) per += Math.hypot(pts[(i + 1) % pts.length][0] - pts[i][0], pts[(i + 1) % pts.length][1] - pts[i][1])
  const nz = noise1(rng, per + 60, 22), nz2 = noise1(rng, per + 60, 6)
  const sgn = area(pts) >= 0 ? 1 : -1
  let s = 0
  return pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length], r = pts[(i - 1 + pts.length) % pts.length]
    const tx = q[0] - r[0], ty = q[1] - r[1]
    const l = Math.hypot(tx, ty) || 1
    if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])
    const off = amt * (nz(s) * 0.8 + nz2(s) * 0.5)
    return [p[0] + (ty / l) * sgn * off, p[1] - (tx / l) * sgn * off]
  })
}

export function solidFill(ink: Ink, poly: Pt[], color: PaintKey, o: { alpha?: number; inset?: number; rough?: number; material?: Material } = {}): Offset {
  const rng = ink.next('solid')
  const inner = o.inset ? offsetPoly(poly, -o.inset, 0, 0) : poly
  ink.poly(o.material ?? 'marker', rough(inner, rng, o.rough ?? 0.1, 4), color, o.alpha ?? 0.94)
  return { dx: 0, dy: 0 }
}

export function flatFill(ink: Ink, poly: Pt[], color: PaintKey, alpha = 0.5, material: Material = 'marker'): void {
  if (poly.length < 3) return
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of poly) {
    if (p[0] < x0) x0 = p[0]
    if (p[0] > x1) x1 = p[0]
    if (p[1] < y0) y0 = p[1]
    if (p[1] > y1) y1 = p[1]
  }
  const d = 'M' + poly.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L') + 'Z'
  ink.flat(material, d, color, alpha, { bbox: [x0, y0, x1, y1] })
}

const solidAlpha = (alpha: number | undefined, fallback: number, passes = 1): number => clamp((alpha ?? fallback) * (passes > 1 ? 1.14 : 1.08), 0.3, 0.96)

export interface BandOpts {
  alpha?: number
  mis?: number | false
  passes?: 1 | 2
  angle?: number
  W?: number
  overlap?: number
  ends?: 'loose' | 'flag' | 'square'
  material?: Material
}

export function bandFill(ink: Ink, poly: Pt[], color: PaintKey, o: BandOpts = {}): Offset {
  return solidFill(ink, poly, color, { alpha: solidAlpha(o.alpha, 0.85, o.passes ?? 1), material: o.material })
}

export interface BlobOpts {
  alpha?: number
  mis?: number | false
  rough?: number
  material?: Material
}

export function blobFill(ink: Ink, poly: Pt[], color: PaintKey, o: BlobOpts = {}): Offset {
  const rng = ink.next('blob')
  const at = laid(ink, poly, o.mis)
  ink.poly(o.material ?? 'marker', rough(at, rng, Math.min(o.rough ?? 0.1, 0.12), 4), color, Math.max(o.alpha ?? 0.9, 0.92))
  return shiftOf(poly, at)
}

export function wash(ink: Ink, poly: Pt[], color: PaintKey, o: { alpha?: number; inset?: number; shift?: number; wobble?: number; material?: Material } = {}): Offset {
  const rng = ink.next('wash')
  const b = bboxOf(poly)
  const size = Math.max(b[2] - b[0], b[3] - b[1])
  const dn = o.shift ?? 0.007 * size + 0.3
  const P = wobblePoly(densifyClosed(offsetPoly(poly, -(o.inset ?? 0.9), dn * 0.85 * ink.knobs.misreg, dn * ink.knobs.misreg), 4), rng, (o.wobble ?? 0.7) * ink.knobs.wobble, 18)
  ink.poly(o.material ?? 'marker', P, color, o.alpha ?? 0.5)
  return { dx: dn * 0.85 * ink.knobs.misreg, dy: dn * ink.knobs.misreg }
}

function loosen(a: Pt, b: Pt, rng: Rng, over: number, under: number, cap = 0.3): [Pt, Pt] {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  const t: Pt = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]
  const ext = (): number => (rng() < 0.3 ? -rng() * under : rng() * over)
  const e0 = Math.max(ext(), -cap * L), e1 = Math.max(ext(), -cap * L)
  return [[a[0] - t[0] * e0, a[1] - t[1] * e0], [b[0] + t[0] * e1, b[1] + t[1] * e1]]
}

export interface HatchOpts {
  angle?: number
  gap?: number
  cross?: boolean | number
  tones?: 1 | 2 | 3
  over?: number
  under?: number
  skip?: number
  pen?: PenName | PenSpec
  alpha?: number
  width?: number
  opts?: StrokeOpts
}

export function hatch(ink: Ink, region: Pt[] | [number, number, number, number], o: HatchOpts = {}): void {
  const rng = ink.next('hatch')
  const poly: Pt[] = region.length === 4 && typeof region[0] === 'number'
    ? ((r: [number, number, number, number]) => [[r[0], r[1]], [r[0] + r[2], r[1]], [r[0] + r[2], r[1] + r[3]], [r[0], r[1] + r[3]]] as Pt[])(region as [number, number, number, number])
    : (region as Pt[])
  const gap = o.gap ?? 4
  const a0 = (o.angle ?? 60) + rng.gauss(0, 1.2)
  const tones = o.tones ?? (o.cross ? 2 : 1)
  const crossOff = typeof o.cross === 'number' ? o.cross : 78
  const passes = [a0, ...(tones >= 2 ? [a0 + crossOff] : []), ...(tones >= 3 ? [a0 + crossOff / 2 + 8] : [])]
  passes.forEach((deg, pi) => {
    const g = gap * (pi ? 1.3 : 1)
    const spans = scanSpans(poly, (deg * Math.PI) / 180, g, rng, { jitter: 0.15, even: false })
    const lines: Line[] = []
    let flip = false
    for (const sp of spans) {
      if (o.skip && rng.chance(o.skip)) continue
      let [la, lb] = loosen(sp.a, sp.b, rng, o.over ?? 1.6, o.under ?? 1.4)
      flip = !flip
      if (flip) [la, lb] = [lb, la]
      const mid: Pt = [(la[0] + lb[0]) / 2 + rng.gauss(0, 0.25), (la[1] + lb[1]) / 2 + rng.gauss(0, 0.25)]
      lines.push({ pts: [la, mid, lb], o: { simple: true, end: 'flick', start: rng.chance(0.4) ? 'pool' : 'soft', speed: 1.3, wobble: 0.5, width: (o.width ?? 1) * rng.range(0.85, 1.15), alpha: o.alpha ?? 0.85 } })
    }
    ink.lines(lines, o.pen ?? 'pencil', o.opts)
  })
}

export function highlight(ink: Ink, x: number, y: number, w: number, h: number, o: { pen?: PenName | PenSpec; k?: number; opts?: StrokeOpts } = {}): void {
  const rng = ink.next('hl')
  const cy = y + h / 2
  const x1 = x - (1 + rng() * 3), x2 = x + w + 1 + rng() * 4
  const y1 = cy + rng.gauss(0, 0.04 * h), y2 = cy + rng.gauss(0, 0.05 * h) - 0.004 * w
  const mid: Pt = [(x1 + x2) / 2, (y1 + y2) / 2 + rng.gauss(0, 0.04 * h)]
  const P = resolvePen(o.pen ?? 'hi')
  ink.stroke([[x1, y1], mid, [x2, y2]], P, { width: (h * (o.k ?? 0.86)) / P.W, end: rng() < 0.5 ? 'flick' : 'pool', start: 'pool', wobble: 0.6, ...o.opts })
}
