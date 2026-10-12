// 左墙上那扇窗的两支循环动画：日间八条光芒绕日面转圈，夜里星点与四角星各自下暗回亮
// 画布沿用两张窗共用的裁切 viewBox="88 176 940 1092"，画稿坐标减 (88,176) 即画布坐标，与 .brook-window 的盒子一比一落位
// 几何与配色直接从 src/features/home/assets 的两份窗稿读，画稿改了重跑本脚本即可对齐
// 字段口径对齐 build-brook-lottie：路径属性键名是 ks，缓动的 x/y 写成数组，静态值 a:0
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import parsePath from 'svg-path-parser';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dayFile = join(root, 'src', 'features', 'home', 'assets', 'cat-window.svg');
const nightFile = join(root, 'src', 'features', 'home', 'assets', 'cat-window-night.svg');
const sunOut = join(root, 'public', 'lottie', 'window-sun.json');
const starsOut = join(root, 'public', 'lottie', 'window-stars.json');

const FPS = 30;
const VIEW = [88, 176]; // 共用裁切的左上角
const W = 940;
const H = 1092;
const SUN_LOOP = 720; // 24s 转满一圈，匀速才没有每圈一次的加速感
const STAR_LOOP = 240; // 8s 一轮，每颗星的下暗窗口完整落在轮内，接缝处全体回到满亮

const LINEAR = { i: { x: [0.833, 0.833], y: [0.833, 0.833] }, o: { x: [0.167, 0.167], y: [0.167, 0.167] } };
const EASE_SINE = { i: { x: [0.4, 0.4], y: [1, 1] }, o: { x: [0.6, 0.6], y: [0, 0] } };

const round = (value, digits = 3) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const colorOf = (hex) => {
  const [r, g, b] = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16) / 255);
  return { a: 0, k: [round(r, 6), round(g, 6), round(b, 6), 1] };
};

const staticValue = (value) => ({ a: 0, k: value });

const animated = (stops, ease) => ({
  a: 1,
  k: stops.map(([t, s], index) => (index === stops.length - 1 ? { t, s } : { ...ease, t, s })),
});

const pick = (html, re, what) => {
  const match = re.exec(html);
  if (!match) throw new Error(`${what} not found`);
  return match;
};

// 直线退化为自己端点当控制点的三次曲线，切线为零即插出笔直的线段
const toCubics = (d) => {
  const cubics = [];
  let cursor = null;
  for (const segment of parsePath(d)) {
    if (segment.code === 'M') {
      cursor = [segment.x, segment.y];
      continue;
    }
    if (segment.code === 'Z') continue;
    const end = [segment.x, segment.y];
    if (segment.code === 'L') {
      cubics.push({ start: cursor, c1: cursor, c2: end, end });
      cursor = end;
      continue;
    }
    if (segment.code === 'C') {
      cubics.push({ start: cursor, c1: [segment.x1, segment.y1], c2: [segment.x2, segment.y2], end });
      cursor = end;
      continue;
    }
    if (segment.code === 'Q') {
      const control = [segment.x1, segment.y1];
      cubics.push({
        start: cursor,
        c1: cursor.map((value, i) => value + (2 / 3) * (control[i] - value)),
        c2: end.map((value, i) => value + (2 / 3) * (control[i] - value)),
        end,
      });
      cursor = end;
      continue;
    }
    throw new Error(`unsupported path command ${segment.code}`);
  }
  if (!cubics.length) throw new Error('path has no segment');
  return cubics;
};

const sampleBounds = (d) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { start, c1, c2, end } of toCubics(d)) {
    for (let index = 0; index <= 120; index += 1) {
      const t = index / 120;
      const mt = 1 - t;
      const x = mt ** 3 * start[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * end[0];
      const y = mt ** 3 * start[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * end[1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
};

// 首尾重合的路径去掉重复末顶点，由 c:true 的自动闭合段承接最后一条曲线
const toShape = (d, name, offset) => {
  const cubics = toCubics(d);
  const vertices = [cubics[0].start, ...cubics.map((cubic) => cubic.end)];
  const outTangents = cubics.map((cubic) => [cubic.c1[0] - cubic.start[0], cubic.c1[1] - cubic.start[1]]);
  const inTangents = cubics.map((cubic) => [cubic.c2[0] - cubic.end[0], cubic.c2[1] - cubic.end[1]]);
  const last = cubics[cubics.length - 1];
  const closed = Math.abs(last.end[0] - cubics[0].start[0]) < 1e-6
    && Math.abs(last.end[1] - cubics[0].start[1]) < 1e-6;
  if (closed) {
    vertices.pop();
    inTangents.unshift(inTangents.pop());
  } else {
    inTangents.unshift([0, 0]);
    outTangents.push([0, 0]);
  }
  const mapVertex = ([x, y]) => [round(x - offset[0]), round(y - offset[1])];
  const mapTangent = ([x, y]) => [round(x), round(y)];
  return {
    ty: 'sh',
    nm: name,
    np: vertices.length,
    ks: {
      a: 0,
      k: {
        i: inTangents.map(mapTangent),
        o: outTangents.map(mapTangent),
        v: vertices.map(mapVertex),
        c: closed,
      },
    },
  };
};

const groupTransform = () => ({
  ty: 'tr',
  p: staticValue([0, 0]),
  a: staticValue([0, 0]),
  s: staticValue([100, 100]),
  r: staticValue(0),
  o: staticValue(100),
});

const shapeLayer = (nm, ind, op, ks, items) => ({
  ddd: 0,
  ind,
  ty: 4,
  nm,
  sr: 1,
  ks,
  ao: 0,
  shapes: [{ ty: 'gr', nm, it: [...items, groupTransform()] }],
  ip: 0,
  op,
  st: 0,
  bm: 0,
});

const composition = (nm, op, layers) => ({
  v: '5.7.4',
  fr: FPS,
  ip: 0,
  op,
  w: W,
  h: H,
  nm,
  ddd: 0,
  assets: [],
  layers,
});

// ---------- 日间：八条光芒整体绕日面圆心转一圈 ----------
const day = readFileSync(dayFile, 'utf8');
const rayAttrs = pick(day, /<g (stroke="#111412"[^>]*)>/, 'sun ray group')[1];
const rayColor = pick(rayAttrs, /stroke="([^"]+)"/, 'ray stroke')[1];
const rayWidth = Number(pick(rayAttrs, /stroke-width="([-\d.]+)"/, 'ray stroke width')[1]);
const rayBlock = day.slice(day.indexOf(rayAttrs) + rayAttrs.length);
const rayPaths = [...rayBlock.slice(0, rayBlock.indexOf('</g>')).matchAll(/<path d="([^"]+)"\s*\/>/g)].map((m) => m[1]);

// 转圈支点取日面包围盒中心：光芒内端离盘面 31 单位，压在窗稿之上不碰盘面
const disk = sampleBounds(pick(day, /<path d="([^"]+)"[^>]*fill="url\(#sun\)"/, 'sun disk')[1]);
const center = [round(disk.cx - VIEW[0]), round(disk.cy - VIEW[1])];

const sunAnimation = composition('window-sun', SUN_LOOP, [
  shapeLayer('sun-rays', 1, SUN_LOOP, {
    // 支点与位置同为日面圆心，静止帧与画稿逐字重合，转圈只落在 r 上
    a: staticValue(center),
    o: staticValue(100),
    r: animated([[0, [0]], [SUN_LOOP, [360]]], LINEAR),
    p: staticValue(center),
    s: staticValue([100, 100]),
  }, [
    ...rayPaths.map((d, index) => toShape(d, `ray-${index + 1}`, VIEW)),
    {
      ty: 'st',
      nm: 'ink',
      c: colorOf(rayColor),
      o: staticValue(100),
      w: staticValue(rayWidth),
      lc: 2,
      lj: 2,
    },
  ]),
]);

// ---------- 夜里：星点只下暗，四角星下暗同时张一口气 ----------
const night = readFileSync(nightFile, 'utf8');
const groupBlock = (id) => {
  const open = pick(night, new RegExp(`<g id="${id}"([^>]*)>`), `#${id}`);
  const body = night.slice(night.indexOf(open[0]) + open[0].length);
  return { attrs: open[1], inner: body.slice(0, body.indexOf('</g>')) };
};

const dotsGroup = groupBlock('star-dots');
const dotColor = pick(dotsGroup.attrs, /fill="([^"]+)"/, 'dot fill')[1];
const dots = [...dotsGroup.inner.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"\s*\/>/g)]
  .map((m) => m.slice(1).map(Number));

const crossesGroup = groupBlock('star-crosses');
const crossFill = pick(crossesGroup.attrs, /fill="([^"]+)"/, 'cross fill')[1];
const crossStroke = pick(crossesGroup.attrs, /stroke="([^"]+)"/, 'cross stroke')[1];
const crossWidth = Number(pick(crossesGroup.attrs, /stroke-width="([-\d.]+)"/, 'cross stroke width')[1]);
const sparkPath = pick(night, /<path id="spark" d="([^"]+)"/, 'spark path')[1];
const crosses = [...crossesGroup.inner.matchAll(
  /href="#spark"[^>]*transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\((-?[\d.]+)\) scale\(([\d.]+) ([\d.]+)\)"/g,
)].map((m) => m.slice(1).map(Number));

// [起始帧, 下暗窗口, 谷底亮度]：相位错开到同一时刻最多两颗在掉，节奏才不像排队
const DOT_SCHEDULE = [
  [8, 44, 32], [52, 38, 45], [96, 48, 28], [130, 36, 50], [168, 52, 30],
  [24, 40, 52], [112, 34, 38], [186, 44, 42], [152, 38, 55], [200, 36, 35],
];
// 四角星另带一次张幅，谷底更深、窗口更长，是夜里的主光
const CROSS_SCHEDULE = [
  [30, 64, 48, 1.14], [120, 70, 52, 1.18], [190, 44, 45, 1.12], [76, 58, 55, 1.2],
];
const twinkle = (start, span, bottom) => animated(
  [[0, [100]], [start, [100]], [start + span / 2, [bottom]], [start + span, [100]], [STAR_LOOP, [100]]],
  EASE_SINE,
);

const breatheScale = (start, span, size, amount) => animated(
  [
    [0, size],
    [start, size],
    [start + span / 2, size.map((value) => round(value * amount))],
    [start + span, size],
    [STAR_LOOP, size],
  ],
  EASE_SINE,
);

const starLayers = [
  ...dots.map(([cx, cy, r], index) => shapeLayer(`star-dot-${index + 1}`, index + 1, STAR_LOOP, {
    a: staticValue([0, 0]),
    o: twinkle(...DOT_SCHEDULE[index]),
    r: staticValue(0),
    p: staticValue([round(cx - VIEW[0]), round(cy - VIEW[1])]),
    s: staticValue([100, 100]),
  }, [
    { ty: 'el', nm: 'circle', p: staticValue([0, 0]), s: staticValue([r * 2, r * 2]) },
    { ty: 'fl', nm: 'gold', c: colorOf(dotColor), o: staticValue(100), r: 1 },
  ])),
  ...crosses.map(([cx, cy, rotate, sx, sy], index) => {
    const [start, span, bottom, amount] = CROSS_SCHEDULE[index];
    return shapeLayer(`star-cross-${index + 1}`, dots.length + index + 1, STAR_LOOP, {
      a: staticValue([0, 0]),
      o: twinkle(start, span, bottom),
      r: staticValue(rotate),
      p: staticValue([round(cx - VIEW[0]), round(cy - VIEW[1])]),
      s: breatheScale(start, span, [round(sx * 100), round(sy * 100)], amount),
    }, [
      toShape(sparkPath, 'spark', [0, 0]),
      { ty: 'fl', nm: 'gold', c: colorOf(crossFill), o: staticValue(100), r: 1 },
      { ty: 'st', nm: 'edge', c: colorOf(crossStroke), o: staticValue(100), w: staticValue(crossWidth), lc: 2, lj: 2 },
    ]);
  }),
];

const starsAnimation = composition('window-stars', STAR_LOOP, starLayers);

mkdirSync(dirname(sunOut), { recursive: true });
writeFileSync(sunOut, `${JSON.stringify(sunAnimation, null, 2)}\n`, 'utf8');
writeFileSync(starsOut, `${JSON.stringify(starsAnimation, null, 2)}\n`, 'utf8');

console.log(`rays ${rayPaths.length} @ ${rayWidth} ${rayColor} center [${center}] loop ${SUN_LOOP / FPS}s`);
console.log(`stars ${dots.length} dots + ${crosses.length} crosses @ ${dotColor} loop ${STAR_LOOP / FPS}s`);
console.log(`wrote ${sunOut}`);
console.log(`wrote ${starsOut}`);
