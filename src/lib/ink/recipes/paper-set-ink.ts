import { n } from '@/lib/ink/paint'

export const tok = (name: string) => `var(--ll-${name})`
export const num = (v: number) => n(v, 10)

export interface PathAttrs {
  fill?: string
  stroke?: string
  sw?: number
  op?: number
  transform?: string
  cap?: 'round' | 'butt'
  extra?: string
}

export function pathTag(d: string, a: PathAttrs): string {
  let s = `<path d="${d}"`
  s += a.fill ? ` fill="${a.fill}"` : ' fill="none"'
  if (a.stroke) s += ` stroke="${a.stroke}" stroke-width="${n(a.sw ?? 1)}" stroke-linecap="${a.cap ?? 'round'}" stroke-linejoin="round"`
  if (a.op !== undefined && a.op < 0.995) s += ` ${a.stroke && !a.fill ? 'stroke' : 'fill'}-opacity="${n(a.op, 100)}"`
  if (a.transform) s += ` transform="${a.transform}"`
  if (a.extra) s += ` ${a.extra}`
  return s + '/>'
}

export const circleD = (cx: number, cy: number, r: number) =>
  `M${num(cx - r)} ${num(cy)}a${num(r)} ${num(r)} 0 1 0 ${num(2 * r)} 0a${num(r)} ${num(r)} 0 1 0 ${num(-2 * r)} 0z`

export function litEdge(d: string, op = 0.7): string {
  return pathTag(d, { stroke: tok('photo'), sw: 1, op, transform: 'translate(0 -.6)' })
}
