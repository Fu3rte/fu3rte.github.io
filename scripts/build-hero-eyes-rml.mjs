import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import parse from 'svg-path-parser';

// 眼窝逐路径转写成 RML：RML 不接收 SVG 的 d 字符串，只吃顶点，所以这里做一次性几何换算
const repo = fileURLToPath(new URL('..', import.meta.url));
const svgPath = fileURLToPath(new URL('../src/features/home/assets/hooded-skull.svg', import.meta.url));
const projectDir = fileURLToPath(new URL('../rive/hero-eyes/', import.meta.url));
const outRiv = fileURLToPath(new URL('../public/rive/hero-eyes.riv', import.meta.url));
const outWasm = fileURLToPath(new URL('../public/rive/rive.wasm', import.meta.url));

const OFFSET_X = 472;
const CLOSE = 4;
const HOLD = 5;
const END = 12;
const SQUASH = 0.06;
const EASE = [0.42, 0, 0.58, 1];
const ALLOWED_PATH_ATTRS = ['d', 'fill', 'id'];

let seq = 0;
const nextId = () => `0:${(seq += 1)}`;
const n = (v) => String(Math.round(v * 1000) / 1000);
const r = (v) => String(Math.round(v * 1e6) / 1e6);
const attrsOf = (tag) => Object.fromEntries([...tag.matchAll(/([a-z-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

const svg = readFileSync(svgPath, 'utf8');

const groupBody = (name) => {
  const open = svg.indexOf(`<g id="${name}">`);
  if (open < 0) throw new Error(`素材里没有 #${name} 分组`);
  const body = svg.slice(open, svg.indexOf('</g>', open));
  if (/<g\b/.test(body.slice(1))) throw new Error(`#${name} 内有嵌套 g，转写器只吃扁平分组`);
  return body;
};

const channel = (value) => {
  const v = value.trim();
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`只支持六位十六进制颜色：${v}`);
  return `FF${v.slice(1).toUpperCase()}`;
};

const fraction = (value) => (value.endsWith('%') ? Number.parseFloat(value) / 100 : Number.parseFloat(value));

const stopsOf = (body, name) => {
  const stops = [...body.matchAll(/<stop\b[^/>]*\/?>/g)].map((m) => {
    const a = attrsOf(m[0]);
    if (a['stop-opacity'] !== undefined && Number(a['stop-opacity']) !== 1) throw new Error(`渐变 stop 带 stop-opacity：${m[0]}`);
    return { color: channel(a['stop-color']), position: fraction(a.offset ?? '0') };
  });
  if (stops.length < 2) throw new Error(`渐变至少两个 stop：#${name}`);
  return stops;
};

const gradientOf = (name) => {
  const m = svg.match(new RegExp(`<(radialGradient|linearGradient)\\b[^>]*id="${name}"[^>]*>([\\s\\S]*?)</\\1>`));
  if (!m) throw new Error(`defs 里找不到 #${name}`);
  return { tag: m[1], attrs: attrsOf(m[0].slice(0, m[0].indexOf('>'))), stops: stopsOf(m[2], name) };
};

const curvePoints = (segs) => {
  const pts = [];
  let px = 0, py = 0;
  for (const s of segs) {
    if (s.command === 'moveto' || s.command === 'lineto') {
      px = s.x; py = s.y; pts.push([px, py]);
    } else if (s.command === 'curveto') {
      for (let i = 1; i <= 48; i += 1) {
        const t = i / 48, u = 1 - t;
        pts.push([
          u ** 3 * px + 3 * u * u * t * s.x1 + 3 * u * t * t * s.x2 + t ** 3 * s.x,
          u ** 3 * py + 3 * u * u * t * s.y1 + 3 * u * t * t * s.y2 + t ** 3 * s.y,
        ]);
      }
      px = s.x; py = s.y;
    } else if (s.command === 'closepath') {
      if (pts.length) pts.push(pts[0]);
    } else {
      throw new Error(`转写器只支持 moveto/lineto/curveto/closepath，遇到 ${s.command}`);
    }
  }
  return pts;
};

const boxOf = (pts) => pts.reduce((b, [x, y]) => ({
  x0: Math.min(b.x0, x), y0: Math.min(b.y0, y), x1: Math.max(b.x1, x), y1: Math.max(b.y1, y),
}), { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });

// 屏幕坐标 y 向下，shoelace 正面积即顺时针
const isClockwise = (pts) => pts.reduce((a, p, i) => (i ? a + pts[i - 1][0] * p[1] - p[0] * pts[i - 1][1] : 0), 0) > 0;

const anchors = (segs) => {
  const verts = [];
  let closed = false;
  for (const s of segs) {
    if (s.isAbsolute === false) throw new Error(`只支持绝对坐标，遇到相对 ${s.command}`);
    if (s.command === 'moveto') {
      if (verts.length) throw new Error('一条 path 只允许一个子路径');
      verts.push({ x: s.x, y: s.y });
    } else if (s.command === 'lineto') {
      verts.push({ x: s.x, y: s.y });
    } else if (s.command === 'curveto') {
      const prev = verts.at(-1);
      if (!prev) throw new Error('curveto 出现在 moveto 之前');
      prev.out = [s.x2, s.y2];
      verts.push({ x: s.x, y: s.y, in: [s.x2, s.y2] });
    } else if (s.command === 'closepath') {
      closed = true;
    }
  }
  return { verts, closed };
};

const handleAttrs = (v, key) => {
  const name = key === 'in' ? 'inRotation' : 'outRotation';
  const dist = key === 'in' ? 'inDistance' : 'outDistance';
  const h = v[key];
  if (!h) return `${name}="0" ${dist}="0"`;
  return `${name}="${r(Math.atan2(h[1] - v.y, h[0] - v.x))}" ${dist}="${n(Math.hypot(h[0] - v.x, h[1] - v.y))}"`;
};

// 每个片段是 [相对层级, 文本]，装配时统一缩进
const paintOf = (fill, box) => {
  const ref = fill?.match(/^url\(#([^)]+)\)$/);
  if (!ref) return [[1, `<SolidColor name="Color" id="${nextId()}" colorValue="${channel(fill ?? '')}"/>`]];
  const grad = gradientOf(ref[1]);
  const gid = nextId();
  const stops = grad.stops.map((s) => [3, `<GradientStop name="Stop" id="${nextId()}" colorValue="${s.color}" position="${n(s.position)}"/>`]);
  const span = (v, axis) => (axis === 'x' ? box.x0 + fraction(v) * (box.x1 - box.x0) : box.y0 + fraction(v) * (box.y1 - box.y0));
  if (grad.tag === 'radialGradient') {
    if (grad.attrs.gradientUnits === 'userSpaceOnUse') throw new Error(`#${ref[1]} 用了 userSpaceOnUse，转写器按 objectBoundingBox 出`);
    const w = box.x1 - box.x0, h = box.y1 - box.y0;
    const cx = span(grad.attrs.cx, 'x'), cy = span(grad.attrs.cy, 'y');
    const radius = fraction(grad.attrs.r) * Math.sqrt((w * w + h * h) / 2);
    return [
      [1, `<RadialGradient name="Gradient" id="${gid}" startX="${n(cx)}" startY="${n(cy)}" endX="${n(cx + radius)}" endY="${n(cy)}">`],
      ...stops,
      [1, '</RadialGradient>'],
    ];
  }
  const abs = grad.attrs.gradientUnits === 'userSpaceOnUse';
  const at = (v, axis) => (abs ? Number(v) : span(v, axis));
  return [
    [1, `<LinearGradient name="Gradient" id="${gid}" startX="${n(at(grad.attrs.x1, 'x'))}" startY="${n(at(grad.attrs.y1, 'y'))}" endX="${n(at(grad.attrs.x2, 'x'))}" endY="${n(at(grad.attrs.y2, 'y'))}">`],
    ...stops,
    [1, '</LinearGradient>'],
  ];
};

const shapeOf = (tag) => {
  const a = attrsOf(tag);
  const extra = Object.keys(a).filter((k) => !ALLOWED_PATH_ATTRS.includes(k));
  if (extra.length) throw new Error(`${a.id ?? 'path'} 带未覆盖的属性：${extra.join(', ')}`);
  const segs = parse(a.d);
  const pts = curvePoints(segs);
  const { verts, closed } = anchors(segs);
  return [
    [0, `<Shape name="${a.id ?? 'socket-part'}" id="${nextId()}" x="0" y="0">`],
    [1, `<PointsPath name="Path" id="${nextId()}" isClosed="${closed}" isClockwise="${isClockwise(pts)}">`],
    ...verts.map((v) => [2, `<CubicDetachedVertex x="${n(v.x)}" y="${n(v.y)}" ${handleAttrs(v, 'in')} ${handleAttrs(v, 'out')}/>`]),
    [1, '</PointsPath>'],
    [1, `<Fill name="Fill" id="${nextId()}">`],
    ...paintOf(a.fill, boxOf(pts)),
    [1, '</Fill>'],
    [0, '</Shape>'],
  ];
};

const socketBlocks = ['left-eye-socket', 'right-eye-socket'].map((name) => {
  const tags = [...groupBody(name).matchAll(/<path\b[^>]*\/>/g)].map((m) => m[0]);
  if (!tags.length) throw new Error(`#${name} 里没有 path`);
  const box = tags.reduce((acc, t) => {
    const b = boxOf(curvePoints(parse(attrsOf(t).d)));
    return { x0: Math.min(acc.x0, b.x0), y0: Math.min(acc.y0, b.y0), x1: Math.max(acc.x1, b.x1), y1: Math.max(acc.y1, b.y1) };
  }, { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
  return { name, box, tags: tags.reverse() };
});

const pivotIds = [];
const socketsXml = socketBlocks.flatMap((s) => {
  const pivot = nextId();
  pivotIds.push(pivot);
  const cx = (s.box.x0 + s.box.x1) / 2, cy = (s.box.y0 + s.box.y1) / 2;
  return [
    [0, `<Node name="${s.name}-pivot" id="${pivot}" x="${n(cx)}" y="${n(cy)}">`],
    [1, `<Node name="${s.name}-art" id="${nextId()}" x="${n(-cx)}" y="${n(-cy)}">`],
    ...s.tags.flatMap((t) => shapeOf(t).map(([lvl, text]) => [lvl + 2, text])),
    [1, '</Node>'],
    [0, '</Node>'],
  ];
});

const keyframes = (value, at, last) => last
  ? [[2, `<KeyFrameDouble value="${n(value)}" frame="${at}"/>`]]
  : [
    [2, `<KeyFrameDouble value="${n(value)}" frame="${at}" interpolationType="cubic">`],
    [3, `<CubicEaseInterpolator x1="${EASE[0]}" y1="${EASE[1]}" x2="${EASE[2]}" y2="${EASE[3]}"/>`],
    [2, '</KeyFrameDouble>'],
  ];

const artboardId = nextId();
const offsetId = nextId();
const smId = nextId();
const layerId = nextId();
const idleAnimId = nextId();
const blinkAnimId = nextId();
const idleStateId = nextId();
const blinkStateId = nextId();
const vmId = nextId();
const vmPropId = nextId();
const vmInstId = nextId();
const vmValueId = nextId();

const xml = [
  [[0, '<Rive version="1" kind="fragment">'],
  [1, `<Artboard name="HeroEyes" id="${artboardId}" width="2198" height="1254" defaultStateMachineId="${smId}" viewModelId="${vmId}">`],
  [2, `<Node name="hero-offset" id="${offsetId}" x="${OFFSET_X}" y="0">`],
  ...socketsXml.map(([lvl, text]) => [lvl + 3, text]),
  [2, '</Node>'],
  [0, ''],
  [2, `<StateMachine name="Blink" id="${smId}">`],
  [3, `<StateMachineLayer name="Blink Layer" id="${layerId}">`],
  [4, '<AnyState x="420" y="-160"/>'],
  [4, '<ExitState x="540" y="-160"/>'],
  [4, `<EntryState x="0" y="0"><StateTransition stateToId="${idleStateId}"/></EntryState>`],
  [4, `<AnimationState id="${idleStateId}" animationId="${idleAnimId}" x="0" y="120">`],
  [5, `<StateTransition stateToId="${blinkStateId}" duration="0">`],
  [6, '<TransitionViewModelCondition opValue="equal">'],
  [7, '<TransitionPropertyViewModelComparator>'],
  [8, '<BindablePropertyBoolean>'],
  [9, `<DataBindContext sourcePathIds="${vmId}-${vmPropId}" propertyKey="634"/>`],
  [8, '</BindablePropertyBoolean>'],
  [7, '</TransitionPropertyViewModelComparator>'],
  [7, '<TransitionValueBooleanComparator value="true"/>'],
  [6, '</TransitionViewModelCondition>'],
  [5, '</StateTransition>'],
  [4, '</AnimationState>'],
  [4, `<AnimationState id="${blinkStateId}" animationId="${blinkAnimId}" x="280" y="120" reset="true">`],
  [5, `<StateTransition stateToId="${idleStateId}" duration="0" enableExitTime="true" exitTimeIsPercetange="true" exitTime="100"/>`],
  [4, '</AnimationState>'],
  [3, '</StateMachineLayer>'],
  [2, '</StateMachine>'],
  [0, ''],
  [2, `<LinearAnimation name="Idle" id="${idleAnimId}" loopValue="loop" duration="60" fps="60"/>`],
  [2, `<LinearAnimation name="Blink" id="${blinkAnimId}" loopValue="oneShot" duration="${END}" fps="60">`],
  ...pivotIds.flatMap((p) => [
    [3, `<KeyedObject objectId="${p}">`],
    [4, '<KeyedProperty property="scaleY">'],
    ...keyframes(1, 0), ...keyframes(SQUASH, CLOSE), ...keyframes(SQUASH, HOLD), ...keyframes(1, END, true),
    [4, '</KeyedProperty>'],
    [3, '</KeyedObject>'],
  ]),
  [2, '</LinearAnimation>'],
  [1, '</Artboard>'],
  [0, ''],
  [1, `<ViewModel name="Eyes" id="${vmId}" defaultInstanceId="${vmInstId}">`],
  [2, `<ViewModelPropertyBoolean name="blink" id="${vmPropId}"/>`],
  [2, `<ViewModelInstance name="Default" id="${vmInstId}" viewModelId="${vmId}" exports="true">`],
  [3, `<ViewModelInstanceBoolean name="blink" id="${vmValueId}" viewModelPropertyId="${vmPropId}" propertyValue="false"/>`],
  [2, '</ViewModelInstance>'],
  [1, '</ViewModel>'],
  [0, '</Rive>']],
];

const scene = xml.flat().map(([lvl, text]) => (text ? '  '.repeat(lvl) + text : '')).join('\n') + '\n';

const yamlPath = `${projectDir}/rive.yaml`;
if (!existsSync(yamlPath)) throw new Error(`缺少 ${yamlPath}`);
writeFileSync(`${projectDir}/scene.rml`, scene);
mkdirSync(`${repo}/public/rive`, { recursive: true });

const bin = process.env.RIVE_BIN ?? `${process.env.HOME ?? process.env.USERPROFILE}/.rive/bin/rive.exe`;
execFileSync(bin, [projectDir, '--once'], { cwd: repo, stdio: 'inherit' });
copyFileSync(`${projectDir}/build/hero-eyes.riv`, outRiv);
copyFileSync(`${repo}/node_modules/@rive-app/canvas/rive.wasm`, outWasm);
console.log(`${outRiv} ${statSync(outRiv).size} bytes; ${outWasm} ${statSync(outWasm).size} bytes`);
