import { Ink } from '@/lib/ink/builder'
import type { InkResult } from '@/lib/ink/builder'
import { n, type PaintKey } from '@/lib/ink/paint'
import { clamp, type Rng } from '@/lib/ink/rng'
import { noise1 } from '@/lib/ink/noise'
import { polyPath } from '@/lib/ink/geom'
import type { Pt, Tier } from '@/lib/ink/types'

const tok = (name: string) => `var(--ll-${name})`

interface PathAttrs {
  fill?: string
  stroke?: string
  sw?: number
  op?: number
  transform?: string
  cap?: 'round' | 'butt'
  extra?: string
}
function pathTag(d: string, a: PathAttrs): string {
  let s = `<path d="${d}"`
  s += a.fill ? ` fill="${a.fill}"` : ' fill="none"'
  if (a.stroke) s += ` stroke="${a.stroke}" stroke-width="${n(a.sw ?? 1)}" stroke-linecap="${a.cap ?? 'round'}" stroke-linejoin="round"`
  if (a.op !== undefined && a.op < 0.995) s += ` ${a.stroke && !a.fill ? 'stroke' : 'fill'}-opacity="${n(a.op, 100)}"`
  if (a.transform) s += ` transform="${a.transform}"`
  if (a.extra) s += ` ${a.extra}`
  return s + '/>'
}

const num = (v: number) => n(v, 10)
const poly = (pts: readonly Pt[], close = false) => 'M' + pts.map((p) => `${num(p[0])} ${num(p[1])}`).join('L') + (close ? 'Z' : '')

const circle = (cx: number, cy: number, r: number) => `M${num(cx - r)} ${num(cy)}a${num(r)} ${num(r)} 0 1 0 ${num(2 * r)} 0a${num(r)} ${num(r)} 0 1 0 ${num(-2 * r)} 0z`

interface PropOpts {
  tier?: Tier
  calm?: boolean
}
const make = (seed: string | number, o: PropOpts) => new Ink(seed, { tier: o.tier, calm: o.calm })

export type Accent = 'tomato' | 'tangerine' | 'lemon' | 'grass' | 'teal' | 'sky' | 'grape' | 'bubblegum'

export type TapeKind = 'masking' | 'washi-dots' | 'washi-stripes' | 'washi-zigzag' | 'washi-gingham' | 'kraft' | 'clear'
export const TAPE_KINDS: readonly TapeKind[] = ['masking', 'washi-dots', 'washi-stripes', 'washi-zigzag', 'washi-gingham', 'kraft', 'clear']
export type TapeEnds = 'saw' | 'torn' | 'straight' | 'scissor'

export interface TapeOpts extends PropOpts {
  kind?: TapeKind
  length?: number
  height?: number
  ends?: TapeEnds
  color?: Accent
}

const WASHI_DEFAULT: Record<string, Accent> = { 'washi-dots': 'bubblegum', 'washi-stripes': 'tangerine', 'washi-zigzag': 'grass', 'washi-gingham': 'sky' }
const ENDS_DEFAULT: Record<TapeKind, TapeEnds> = { masking: 'saw', kraft: 'saw', clear: 'straight', 'washi-dots': 'scissor', 'washi-stripes': 'scissor', 'washi-zigzag': 'scissor', 'washi-gingham': 'scissor' }

function tapeEnd(kind: TapeEnds, x0: number, dir: 1 | -1, h: number, r: Rng): Pt[] {
  const slant = r.range(-1.6, 1.6)
  const at = (y: number, depth: number): Pt => [x0 + dir * (depth + (slant * y) / h), y]
  const out: Pt[] = []
  if (kind === 'straight') return [at(0, 0.3), at(h, 0.3)]
  if (kind === 'saw') {
    const pitch = r.range(1.7, 2.3)
    for (let y = 0, k = 0; y < h + 0.1; y += pitch, k++) out.push(at(Math.min(y, h), k % 2 ? r.range(0.8, 1.9) : 0.2))
    return out
  }
  if (kind === 'scissor') {
    const cnt = Math.max(2, Math.round(h / 4.4))
    for (let k = 0; k <= cnt * 2; k++) out.push(at((k / (cnt * 2)) * h, k % 2 ? 1.8 + r.range(-0.15, 0.15) : 0.15))
    return out
  }
  const f = noise1(r, h, 3)
  for (let y = 0; y <= h + 0.1; y += 1.2) out.push(at(Math.min(y, h), 1.3 + 1.6 * f(y)))
  return out
}

export function tape(seed: string | number, o: TapeOpts = {}): InkResult {
  const ink = make(seed, o)
  const kind = o.kind ?? 'masking'
  const w = o.length ?? 72
  const h = o.height ?? 22
  const r = ink.next('tape')
  const ends = o.ends ?? ENDS_DEFAULT[kind]
  const left = tapeEnd(ends, 0.5, 1, h, r.fork('l'))
  const right = tapeEnd(ends, w - 0.5, -1, h, r.fork('r')).reverse()
  const body = polyPath([...left, ...right], 10)
  const accent: PaintKey = o.color ?? WASHI_DEFAULT[kind] ?? 'bubblegum'
  const gid = `ll-tp${ink.seed.toString(36)}`
  ink.group({ clip: body }, () => {
    let s = ''
    switch (kind) {
      case 'masking':
        s += pathTag(`M0 0H${w}V${h}H0Z`, { fill: tok('kraft'), op: 0.2 }) + pathTag(`M0 0H${w}V${h}H0Z`, { fill: tok('tape') })
        break
      case 'kraft':
        s += pathTag(`M0 0H${w}V${h}H0Z`, { fill: tok('kraft'), op: 0.9 })
        break
      case 'clear':
        s += pathTag(`M0 0H${w}V${h}H0Z`, { fill: tok('photo'), op: 0.16 })
        break
      case 'washi-dots':
        s += pathTag(`M0 0H${w}V${h}H0Z`, { fill: tok(accent), op: 0.88 })
        break
      default:
        s += pathTag(`M0 0H${w}V${h}H0Z`, { fill: tok('photo'), op: 0.88 })
    }
    const pr = r.fork('print')
    if (kind === 'washi-dots') {
      let big = '', small = ''
      const gx = h * 0.34
      for (let row = 0, y = h * 0.2; y < h + gx; y += gx * 0.86, row++) {
        for (let x = (row % 2) * gx * 0.5 - gx * 0.2; x < w + gx; x += gx) {
          const jx = pr.gauss(0, 0.22), jy = pr.gauss(0, 0.22)
          if (row % 2) small += circle(x + jx, y + jy, h * 0.058 * pr.range(0.86, 1.14))
          else big += circle(x + jx, y + jy, h * 0.105 * pr.range(0.88, 1.12))
        }
      }
      s += pathTag(big, { fill: tok('photo'), op: 0.94 }) + pathTag(small, { fill: tok('photo'), op: 0.78 })
    } else if (kind === 'washi-stripes') {
      let a = '', b = ''
      for (let x = -h - 4; x < w + h; ) {
        const sw = pr.range(2.6, 4.8)
        const p = `M${num(x)} ${num(h + 1)}L${num(x + sw)} ${num(h + 1)}L${num(x + sw + h + 2)} -1L${num(x + h + 2)} -1Z`
        if (pr() < 0.4) b += p
        else a += p
        x += sw + pr.range(3.6, 5.6)
      }
      s += pathTag(a, { fill: tok(accent), op: 0.9 }) + pathTag(b, { fill: tok(accent), op: 0.7 })
    } else if (kind === 'washi-zigzag') {
      let zz = ''
      const amp = h * 0.075, step = h * 0.27
      for (let row = 0; row < 3; row++) {
        const y0 = h * (0.22 + row * 0.28)
        const pts: Pt[] = []
        for (let x = -step, k = 0; x < w + step; x += step, k++) pts.push([x + pr.gauss(0, 0.12), y0 + (k % 2 ? amp : -amp) + pr.gauss(0, 0.12)])
        zz += poly(pts)
      }
      s += pathTag(zz, { stroke: tok(accent), sw: h * 0.085, op: 0.92 })
    } else if (kind === 'washi-gingham') {
      const q = h / 4.4
      let hb = '', vb = ''
      for (let y = 0, i = 0; y < h + q; y += q, i++) if (i % 2 === 0) hb += `M0 ${num(y)}H${w}V${num(y + q)}H0Z`
      for (let x = pr.range(-q, 0), i = 0; x < w + q; x += q, i++) if (i % 2 === 0) vb += `M${num(x)} 0V${h}H${num(x + q)}V0Z`
      s += pathTag(hb, { fill: tok(accent), op: 0.36 }) + pathTag(vb, { fill: tok(accent), op: 0.36 })
    } else if (kind === 'kraft') {
      let dark = '', light = ''
      for (let i = 0; i < Math.round((w * h) / 26); i++) {
        const x = pr.range(-4, w), y = pr.range(0, h), L = pr.range(4, 22)
        const seg = `M${num(x)} ${num(y)}l${num(L)} ${num(pr.range(-0.5, 0.5))}`
        if (pr() < 0.55) dark += seg
        else light += seg
      }
      s += pathTag(dark, { stroke: tok('orange-text'), sw: 0.45, op: 0.2 }) + pathTag(light, { stroke: tok('photo'), sw: 0.5, op: 0.42 })
    }
    const nc = 1 + Math.floor(r.fork('crinkle')() * 2.4)
    let dark = ''
    for (let i = 0; i < nc; i++) {
      const cr = r.fork('c' + i)
      const x = cr.range(0.15, 0.85) * w
      const sl = cr.range(-0.5, 0.5) * h
      const cw = cr.range(1.6, 4.6)
      dark += `M${num(x - sl / 2 + cw * 0.85)} -1L${num(x + sl / 2 + cw * 0.85)} ${h + 1}`
      s += pathTag(`M${num(x - sl / 2)} -1L${num(x + sl / 2)} ${h + 1}`, { stroke: tok('photo'), sw: cw, op: kind === 'clear' ? 0.5 : 0.2, cap: 'butt' })
    }
    s += pathTag(dark, { stroke: tok('ink'), sw: 0.7, op: kind === 'clear' ? 0.05 : 0.07, cap: 'butt' })
    s += `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tok('photo')}" stop-opacity=".0"/><stop offset=".3" stop-color="${tok('photo')}" stop-opacity="${kind === 'clear' ? 0.5 : 0.24}"/><stop offset=".62" stop-color="${tok('photo')}" stop-opacity="0"/><stop offset="1" stop-color="${tok('ink')}" stop-opacity=".05"/></linearGradient>`
    s += `<rect width="${w}" height="${h}" fill="url(#${gid})"/>`
    s += pathTag(`M0 .5H${w}M0 ${num(h - 0.5)}H${w}`, { stroke: tok('tape-edge'), sw: 0.7, op: kind === 'clear' ? 1 : 0.9, cap: 'butt' })
    s += pathTag(`M0 1.7H${w}M0 ${num(h - 1.7)}H${w}`, { stroke: tok('photo'), sw: 0.6, op: 0.34, cap: 'butt' })
    if (kind === 'masking') {
      let fl = ''
      for (let i = 0; i < Math.round(w / 8); i++) fl += `M${num(r.range(2, w - 2))} ${num(r.range(2, h - 2))}l${num(r.range(1, 5))} ${num(r.range(-0.6, 0.6))}`
      s += pathTag(fl, { stroke: tok('pencil-mark'), sw: 0.4, op: 0.28 })
    }
    ink.raw(s, 'top')
  })
  ink.grow([0, 0, w, h])
  return ink.toSvg({ w, h, pad: 3 })
}

export interface ClipOpts extends PropOpts {
  height?: number
  tone?: 'steel' | Accent
  angle?: number
}

export function clip(seed: string | number, o: ClipOpts = {}): InkResult {
  const ink = make(seed, o)
  const H = o.height ?? 64
  const w = H / 3.4
  const r = ink.next('clip')
  const angle = o.angle ?? clamp(r.gauss(0, 2.4), -4, 4)
  const lw = clamp(w * 0.13, 1.1, 2.6)
  const j = () => r.gauss(0, 0.012)
  const U = (x: number, y: number) => `${num((x + j()) * w)} ${num((y + j()) * w)}`
  const rad = (v: number) => num(v * w)
  const d =
    `M${U(0, 0.95)}V${num((2.9 + j()) * w)}A${rad(0.5)} ${rad(0.5)} 0 0 0 ${U(1, 2.9)}V${num((0.4 + j()) * w)}A${rad(0.4)} ${rad(0.4)} 0 0 0 ${U(0.2, 0.4)}` +
    `V${num((2.6 + j()) * w)}A${rad(0.3)} ${rad(0.3)} 0 0 0 ${U(0.8, 2.6)}V${num((1.2 + j()) * w)}`
  const steel = o.tone === undefined || o.tone === 'steel'
  const base = steel ? tok('pencil') : tok(o.tone as Accent)
  const cx = w / 2, cy = H / 2
  let s = ''
  s += pathTag(d, { stroke: base, sw: lw })
  if (steel) s += pathTag(d, { stroke: tok('sky'), sw: lw, op: 0.16 })
  s += pathTag(d, { stroke: tok('ink'), sw: lw * 0.4, op: steel ? 0.5 : 0.28, transform: `translate(${num(lw * 0.22)} ${num(lw * 0.14)})` })
  s += pathTag(d, { stroke: tok('photo'), sw: lw * 0.32, op: 0.9, transform: `translate(${num(-lw * 0.2)} ${num(-lw * 0.22)})` })
  ink.raw(`<g transform="rotate(${n(angle)} ${num(cx)} ${num(cy)})">${s}</g>`, 'top')
  ink.grow([-lw, -lw, w + lw, H + lw])
  return ink.toSvg({ w, h: H, pad: Math.ceil(lw * 2 + Math.abs(angle) * 0.4) })
}

export interface PinOpts extends PropOpts {
  size?: number
  color?: Accent
}

export function pin(seed: string | number, o: PinOpts = {}): InkResult {
  const ink = make(seed, o)
  const D = o.size ?? 24
  const rr = D / 2
  const w = D * 1.1, h = D * 1.4
  const r = ink.next('pin')
  const cx = w / 2, cy = rr + 1
  const col = tok(o.color ?? 'tomato')
  const tilt = r.range(-6, 6)
  let s = ''
  s += pathTag(`M${num(cx - rr * 0.16)} ${num(cy + rr * 0.6)}L${num(cx + rr * 0.05)} ${num(cy + rr * 1.35)}`, { stroke: tok('pencil'), sw: rr * 0.24 })
  s += pathTag(`M${num(cx - rr * 0.2)} ${num(cy + rr * 0.6)}L${num(cx - rr * 0.01)} ${num(cy + rr * 1.33)}`, { stroke: tok('photo'), sw: rr * 0.08, op: 0.7 })
  s += `<ellipse cx="${num(cx)}" cy="${num(cy + rr * 0.56)}" rx="${num(rr * 1.02)}" ry="${num(rr * 0.4)}" fill="${tok('pencil')}"/>`
  s += `<ellipse cx="${num(cx - rr * 0.1)}" cy="${num(cy + rr * 0.5)}" rx="${num(rr * 0.9)}" ry="${num(rr * 0.28)}" fill="${tok('photo')}" fill-opacity=".5"/>`
  const dome = circle(cx, cy, rr * 0.94)
  const cid = ink.clipDef(dome)
  s += pathTag(dome, { fill: col })
  s += `<g clip-path="url(#${cid})">${pathTag(circle(cx + rr * 0.42, cy + rr * 0.46, rr * 0.98), { fill: tok('ink'), op: 0.24 })}${pathTag(circle(cx + rr * 0.5, cy + rr * 0.55, rr * 0.86), { fill: tok('ink'), op: 0.1 })}</g>`
  s += pathTag(dome, { stroke: tok('ink'), sw: 0.8, op: 0.4 })
  s += `<ellipse cx="${num(cx - rr * 0.34)}" cy="${num(cy - rr * 0.38)}" rx="${num(rr * 0.3)}" ry="${num(rr * 0.2)}" fill="${tok('photo')}" fill-opacity=".8" transform="rotate(-38 ${num(cx - rr * 0.34)} ${num(cy - rr * 0.38)})"/>`
  s += pathTag(circle(cx - rr * 0.06, cy - rr * 0.62, rr * 0.06), { fill: tok('photo'), op: 0.9 })
  ink.raw(`<g transform="rotate(${n(tilt)} ${num(cx)} ${num(cy)})">${s}</g>`, 'top')
  ink.grow([0, 0, w, h])
  return ink.toSvg({ w, h, pad: 3 })
}

export interface StapleOpts extends PropOpts {
  length?: number
  double?: boolean
}

export function staple(seed: string | number, o: StapleOpts = {}): InkResult {
  const ink = make(seed, o)
  const L = o.length ?? 20
  const w = L + 4, h = o.double ? 14 : 8
  const r = ink.next('staple')
  let s = ''
  const one = (y: number, rot: number) => {
    const x0 = 2 + r.range(-0.2, 0.2)
    let g = ''
    g += pathTag(`M${num(x0)} ${num(y)}V${num(y + 2.4)}M${num(x0 + L)} ${num(y)}V${num(y + 2.4)}`, { stroke: tok('ink'), sw: 1.5, op: 0.55 })
    g += pathTag(`M${num(x0)} ${num(y + 0.9)}H${num(x0 + L)}`, { stroke: tok('ink'), sw: 1.9, op: 0.18 })
    g += pathTag(`M${num(x0)} ${num(y)}H${num(x0 + L)}`, { stroke: tok('pencil'), sw: 2.4 })
    g += pathTag(`M${num(x0 + 0.8)} ${num(y - 0.55)}H${num(x0 + L - 0.8)}`, { stroke: tok('photo'), sw: 0.9, op: 0.9 })
    return `<g transform="rotate(${n(rot)} ${num(x0 + L / 2)} ${num(y)})">${g}</g>`
  }
  s += one(2.4, r.range(-5, 5))
  if (o.double) s += one(9, r.range(-5, 5))
  ink.raw(s, 'top')
  ink.grow([0, 0, w, h])
  return ink.toSvg({ w, h, pad: 3 })
}

export interface BinderClipOpts extends PropOpts {
  width?: number
}

export function binderClip(seed: string | number, o: BinderClipOpts = {}): InkResult {
  const ink = make(seed, o)
  const w = o.width ?? 52
  const h = w * 1.14
  const r = ink.next('binder')
  const j = () => r.gauss(0, 0.6)
  const by = h * 0.4
  ink.raw(
    pathTag(`M${num(w * 0.27)} ${num(by + 2)}C${num(w * 0.02 + j())} ${num(h * 0.16)} ${num(w * 0.16)} ${num(1.5)} ${num(w * 0.34)} ${num(1.5 + j() * 0.3)}C${num(w * 0.5)} ${num(1.5)} ${num(w * 0.5)} ${num(h * 0.2)} ${num(w * 0.45)} ${num(by + 2)}`, { stroke: tok('pencil'), sw: 2.1 }) +
      pathTag(`M${num(w * 0.55)} ${num(by + 2)}C${num(w * 0.5 + j())} ${num(h * 0.2)} ${num(w * 0.5)} ${num(1.5)} ${num(w * 0.66)} ${num(1.5 + j() * 0.3)}C${num(w * 0.84)} ${num(1.5)} ${num(w * 0.98 + j())} ${num(h * 0.16)} ${num(w * 0.73)} ${num(by + 2)}`, { stroke: tok('pencil'), sw: 2.1 }) +
      pathTag(`M${num(w * 0.25)} ${num(h * 0.16)}C${num(w * 0.2)} ${num(h * 0.06)} ${num(w * 0.3)} ${num(2.6)} ${num(w * 0.36)} ${num(2.6)}`, { stroke: tok('photo'), sw: 0.8, op: 0.85 }) +
      pathTag(`M${num(w * 0.64)} ${num(2.6)}C${num(w * 0.72)} ${num(2.6)} ${num(w * 0.8)} ${num(h * 0.06)} ${num(w * 0.79)} ${num(h * 0.14)}`, { stroke: tok('photo'), sw: 0.8, op: 0.85 }),
    'under',
  )
  const body: Pt[] = [
    [w * 0.2, by], [w * 0.8, by], [w * 0.98 + j() * 0.4, h * 0.96], [w * 0.02 + j() * 0.4, h * 0.96],
  ]
  const bodyPts = densifyRound(body, 4.5)
  ink.raw(pathTag(poly(bodyPts, true), { fill: tok('ink'), op: 0.96 }), 'wash')
  ink.stroke([...bodyPts, bodyPts[0]], 'ink.brush', { width: 0.55, wobble: 0.5 })
  ink.raw(
    pathTag(`M${num(w * 0.1)} ${num(h * 0.84)}H${num(w * 0.9)}`, { stroke: tok('pencil'), sw: 1.2, op: 0.5 }) +
      pathTag(`M${num(w * 0.24)} ${num(by + 3)}H${num(w * 0.76)}`, { stroke: tok('photo'), sw: 1.2, op: 0.3 }) +
      pathTag(`M${num(w * 0.16)} ${num(by + 6)}L${num(w * 0.07)} ${num(h * 0.8)}`, { stroke: tok('photo'), sw: 1.1, op: 0.2 }),
    'top',
  )
  ink.grow([0, 0, w, h])
  return ink.toSvg({ w, h, pad: 3 })
}

function densifyRound(v: Pt[], rad: number): Pt[] {
  const out: Pt[] = []
  const m = v.length
  for (let i = 0; i < m; i++) {
    const P = v[(i + m - 1) % m], V = v[i], N = v[(i + 1) % m]
    const l1 = Math.hypot(P[0] - V[0], P[1] - V[1]) || 1
    const l2 = Math.hypot(N[0] - V[0], N[1] - V[1]) || 1
    const rr = Math.min(rad, l1 * 0.4, l2 * 0.4)
    const a: Pt = [V[0] + ((P[0] - V[0]) / l1) * rr, V[1] + ((P[1] - V[1]) / l1) * rr]
    const b: Pt = [V[0] + ((N[0] - V[0]) / l2) * rr, V[1] + ((N[1] - V[1]) / l2) * rr]
    for (let k = 0; k <= 4; k++) {
      const t = k / 4, u = 1 - t
      out.push([u * u * a[0] + 2 * u * t * V[0] + t * t * b[0], u * u * a[1] + 2 * u * t * V[1] + t * t * b[1]])
    }
  }
  return out
}

export interface CurlOpts extends PropOpts {
  color?: string
}

export function curlMarkup(r: Rng, id: string, c: number, color = 'sticky-yellow'): string {
  const col = tok(color)
  const jt = () => r.gauss(0, 0.2)
  const a: Pt = [0.2, c + jt()], b: Pt = [c + jt(), 0.2], m: Pt = [c * (0.42 + jt() * 0.05), c * (0.42 + jt() * 0.05)]
  let s = ''
  s += `<linearGradient id="${id}s" gradientUnits="userSpaceOnUse" x1="${num(m[0])}" y1="${num(m[1])}" x2="${num(m[0] - c * 0.16)}" y2="${num(m[1] - c * 0.16)}"><stop offset="0" stop-color="${tok('ink')}" stop-opacity=".16"/><stop offset="1" stop-color="${tok('ink')}" stop-opacity="0"/></linearGradient>`
  s += pathTag(poly([[a[0] - c * 0.12, a[1] - c * 0.12 + 2], [b[0] - c * 0.12 + 2, b[1] - c * 0.12], [m[0] - c * 0.16, m[1] - c * 0.16]], true), { fill: `url(#${id}s)` })
  s += `<linearGradient id="${id}d" gradientUnits="userSpaceOnUse" x1="${num(c / 2)}" y1="${num(c / 2)}" x2="${num(c * 0.86)}" y2="${num(c * 0.86)}"><stop offset="0" stop-color="${tok('ink')}" stop-opacity=".32"/><stop offset="1" stop-color="${tok('ink')}" stop-opacity="0"/></linearGradient>`
  s += pathTag(poly([a, b, [c + 1, c + 1]], true), { fill: `url(#${id}d)` })
  s += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${num(c / 2)}" y1="${num(c / 2)}" x2="${num(m[0])}" y2="${num(m[1])}"><stop offset="0" stop-color="${tok('photo')}" stop-opacity=".95"/><stop offset="1" stop-color="${col}" stop-opacity=".98"/></linearGradient>`
  s += pathTag(poly([a, b, m], true), { fill: `url(#${id})` })
  s += pathTag(poly([a, m, b]), { stroke: tok('ink'), sw: 0.6, op: 0.24 })
  s += pathTag(poly([a, b]), { stroke: tok('photo'), sw: 0.9, op: 0.75 })
  return s
}

export type FastenerKind = 'clip' | 'pin' | 'staple' | 'binder-clip'
