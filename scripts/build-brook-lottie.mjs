// scripts/assets/brook-logo.html 里的 SVG 徽标编译成可播放的 Lottie JSON
// 顶点坐标直接沿用原始绝对坐标（0..626），每层 anchor = position = 几何包围盒中心
// 静止帧满足 (point - anchor) + position === point，与源 SVG 完全重合
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import parsePath from 'svg-path-parser';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceFile = join(root, 'scripts', 'assets', 'brook-logo.html');
const outFile = join(root, 'public', 'lottie', 'brook-load.json');
// 深色主题下压场的是同一支动画的墨色反相变体，帧数与关键帧逐字相同
const darkOutFile = join(root, 'public', 'lottie', 'brook-load.dark.json');

const FPS = 60;
const OUT_POINT = 222;
const SAMPLES = 240; // 每条三次贝塞尔的采样点数，>= 200

// 站点令牌色，RGB 归一化浮点
const ink = [0x14 / 255, 0x14 / 255, 0x14 / 255];
// 深色主题的 --ink：#ecebe7
const night = [0xec / 255, 0xeb / 255, 0xe7 / 255];
const bone = [1, 1, 1];
const purple = [0xa2 / 255, 0x60 / 255, 0xcc / 255];

const round = (value, digits = 3) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const colorOf = (rgb) => ({ a: 0, k: rgb.map((channel) => round(channel, 6)).concat([1]) });

// 墨色在三通道上同值，序列化后是一个可整串替换的字面量
const withInk = (animation, inkColor) =>
  JSON.parse(JSON.stringify(animation).replaceAll(JSON.stringify(colorOf(inkColor)), JSON.stringify(colorOf(night))));

// 逐 id 抓取 path 的 d 属性，缺一条即崩溃
const extractPathData = (html, id) => {
  const match = html.match(new RegExp(`<path[^>]*id="${id}"[^>]*d="([^"]+)"`));
  if (!match) throw new Error(`path #${id} not found in ${sourceFile}`);
  return match[1];
};

// M + 纯 C + Z 的 path 映射为 Lottie 的 v / i / o 三元组
// 末点与起点重合时去掉重复顶点，由 c:true 的自动闭合段承接最后一条曲线
const toShape = (d) => {
  const segments = parsePath(d);
  const cubics = [];
  let cursor = null;
  for (const segment of segments) {
    if (segment.code === 'M') {
      cursor = [segment.x, segment.y];
      continue;
    }
    if (segment.code === 'C') {
      cubics.push({
        start: cursor,
        c1: [segment.x1, segment.y1],
        c2: [segment.x2, segment.y2],
        end: [segment.x, segment.y],
      });
      cursor = [segment.x, segment.y];
      continue;
    }
    if (segment.code === 'Z') continue;
    throw new Error(`unsupported path command ${segment.code}`);
  }

  const last = cubics[cubics.length - 1];
  const closesAtStart = Math.abs(last.end[0] - cubics[0].start[0]) < 1e-6
    && Math.abs(last.end[1] - cubics[0].start[1]) < 1e-6;
  const vertices = [cubics[0].start, ...cubics.map((cubic) => cubic.end)];
  const outTangents = cubics.map((cubic) => [cubic.c1[0] - cubic.start[0], cubic.c1[1] - cubic.start[1]]);
  const inTangents = cubics.map((cubic) => [cubic.c2[0] - cubic.end[0], cubic.c2[1] - cubic.end[1]]);

  if (closesAtStart) {
    vertices.pop();
    // 最后一条曲线的终点即首顶点，其入切线归属首顶点，闭合段自动衔接
    inTangents.unshift(inTangents.pop());
  } else {
    inTangents.unshift([0, 0]);
    outTangents.push([0, 0]);
  }

  const mapPoint = (point) => point.map((value) => round(value));
  return {
    ty: 'sh',
    nm: 'path',
    np: vertices.length,
    ks: {
      a: 0,
      k: {
        i: inTangents.map(mapPoint),
        o: outTangents.map(mapPoint),
        v: vertices.map(mapPoint),
        c: true,
      },
    },
  };
};

// 三次贝塞尔密集采样，取包围盒中心作为支点
const sampleBounds = (d) => {
  const segments = parsePath(d);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const push = (x, y) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };
  let cursor = [0, 0];
  for (const segment of segments) {
    if (segment.code === 'M') {
      cursor = [segment.x, segment.y];
      push(cursor[0], cursor[1]);
      continue;
    }
    if (segment.code === 'C') {
      const [x0, y0] = cursor;
      const x1 = segment.x1;
      const y1 = segment.y1;
      const x2 = segment.x2;
      const y2 = segment.y2;
      const x3 = segment.x;
      const y3 = segment.y;
      for (let index = 0; index <= SAMPLES; index += 1) {
        const t = index / SAMPLES;
        const mt = 1 - t;
        const a = mt * mt * mt;
        const b = 3 * mt * mt * t;
        const c = 3 * mt * t * t;
        const e = t * t * t;
        push(a * x0 + b * x1 + c * x2 + e * x3, a * y0 + b * y1 + c * y2 + e * y3);
      }
      cursor = [x3, y3];
      continue;
    }
    if (segment.code === 'Z') continue;
    throw new Error(`unsupported path command ${segment.code}`);
  }
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
};

const EASE_DRAW = { i: { x: [0.35, 0.35], y: [1, 1] }, o: { x: [0.65, 0.65], y: [0, 0] } };
const EASE_SINE = { i: { x: [0.4, 0.4], y: [1, 1] }, o: { x: [0.6, 0.6], y: [0, 0] } };
// 起手猛、落点稳的一整圈
const EASE_SPIN = { i: { x: [0.18, 0.18], y: [1, 1] }, o: { x: [0.72, 0.72], y: [0, 0] } };

// 关键帧：每条写 s 与 t，可按条覆盖缓动，末帧只写 t 与 s
const makeKeyframes = (stops, ease) =>
  stops.map(([t, s, stopEase], index) =>
    index === stops.length - 1 ? { t, s } : { ...(stopEase ?? ease), t, s },
  );

const animated = (stops, ease) => ({ a: 1, k: makeKeyframes(stops, ease) });
const staticValue = (value) => ({ a: 0, k: value });

const LAYERS = [
  { nm: 'left-eye', ids: ['left-eye'], fill: ink, stroke: ink, draw: [30, 50] },
  { nm: 'right-eye', ids: ['right-eye'], fill: ink, stroke: ink, draw: [32, 52] },
  { nm: 'nose', ids: ['nose'], fill: ink, stroke: ink, draw: [36, 54] },
  { nm: 'skull', ids: ['skull'], fill: bone, stroke: ink, draw: [16, 42], breathe: true },
  { nm: 'hair-hat', ids: ['top-hat-and-curly-hair'], fill: ink, stroke: ink, draw: [6, 30], tilt: true },
  { nm: 'cane', ids: ['cane-hook', 'cane-tip'], fill: purple, stroke: purple, draw: [2, 20], spin: [24, 58], swing: true },
];

const buildGroup = (layer) => {
  const [drawStart, drawEnd] = layer.draw;
  const items = layer.ids.map((id) => toShape(extractPathData(layer.html, id)));
  items.push(
    {
      ty: 'tm',
      m: 1,
      nm: 'draw',
      s: staticValue(0),
      o: staticValue(0),
      e: animated([[drawStart, [0]], [drawEnd, [100]]], EASE_DRAW),
    },
    {
      ty: 'st',
      c: colorOf(layer.stroke),
      nm: 'stroke',
      o: animated([[drawEnd, [100]], [drawEnd + 10, [0]]], EASE_DRAW),
      w: staticValue(3),
      lc: 2,
      lj: 2,
    },
    {
      ty: 'fl',
      c: colorOf(layer.fill),
      nm: 'fill',
      o: animated([[drawEnd - 4, [0]], [drawEnd + 8, [100]]], EASE_DRAW),
      r: 1,
    },
    {
      ty: 'tr',
      p: staticValue([0, 0]),
      a: staticValue([0, 0]),
      s: staticValue([100, 100]),
      r: staticValue(0),
      o: staticValue(100),
    },
  );
  return { ty: 'gr', nm: `${layer.nm}-group`, it: items };
};

const buildTransform = (layer) => {
  const { cx, cy } = layer.bounds;
  // 全身 bob：普通图层 66/105/144/183/222 依次 0 / -7 / 0 / +7 / 0
  // 拐杖与身体反相；66 与 222 一律回到质心，保证组装段静止位与源 SVG 重合
  const bobStops = layer.swing
    ? [[66, 0], [105, 5], [144, 0], [183, -5], [222, 0]]
    : [[66, 0], [105, -7], [144, 0], [183, 7], [222, 0]];
  const position = animated(
    bobStops.map(([t, offset]) => [t, [round(cx), round(cy + offset)]]),
    EASE_SINE,
  );

  let rotation = staticValue(0);
  if (layer.swing) {
    // 组装段里拐杖先自转一整圈；循环段沿用同样的摆幅但整体抬到 360 之上，数值连续而姿态不变
    const [spinStart, spinEnd] = layer.spin;
    const sway = [[66, 0], [105, -4], [144, 0], [183, 4], [222, 0]]
      .map(([t, value]) => [t, [value + 360]]);
    rotation = animated(
      [[spinStart, [0], EASE_SPIN], [spinEnd, [360], EASE_SINE], ...sway],
      EASE_SINE,
    );
  }
  if (layer.tilt) {
    // 周期 78 帧，是 bob 的一半，零点和极值都与 bob 错开
    rotation = animated(
      [
        [66, [0]],
        [85, [1.2]],
        [105, [0]],
        [124, [-1.2]],
        [144, [0]],
        [163, [1.2]],
        [183, [0]],
        [202, [-1.2]],
        [222, [0]],
      ],
      EASE_SINE,
    );
  }

  let scale = staticValue([100, 100]);
  if (layer.breathe) {
    scale = animated(
      [[66, [100, 100]], [144, [101.6, 101.6]], [222, [100, 100]]],
      EASE_SINE,
    );
  }
  return {
    a: staticValue([round(cx), round(cy)]),
    o: staticValue(100),
    r: rotation,
    p: position,
    s: scale,
  };
};

const html = readFileSync(sourceFile, 'utf8');
for (const layer of LAYERS) {
  layer.html = html;
  const bounds = layer.ids.map((id) => sampleBounds(extractPathData(html, id)));
  const minX = Math.min(...bounds.map((b) => b.minX));
  const minY = Math.min(...bounds.map((b) => b.minY));
  const maxX = Math.max(...bounds.map((b) => b.maxX));
  const maxY = Math.max(...bounds.map((b) => b.maxY));
  layer.bounds = { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

const buildAnimation = (inkColor) => ({
  v: '5.7.4',
  fr: FPS,
  ip: 0,
  op: OUT_POINT,
  w: 626,
  h: 626,
  nm: 'brook-load',
  ddd: 0,
  assets: [],
  layers: LAYERS.map((layer, index) => ({
    ddd: 0,
    ind: index + 1,
    ty: 4,
    nm: layer.nm,
    sr: 1,
    ks: buildTransform(layer),
    ao: 0,
    shapes: [buildGroup(layer)],
    ip: 0,
    op: OUT_POINT,
    st: 0,
    bm: 0,
  })),
});

const animation = buildAnimation(ink);

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(animation, null, 2)}\n`, 'utf8');
writeFileSync(darkOutFile, `${JSON.stringify(withInk(animation, ink), null, 2)}\n`, 'utf8');

const report = LAYERS.map((layer) => {
  const [start, end] = layer.draw;
  return [
    layer.nm.padEnd(9),
    `centroid [${round(layer.bounds.cx, 2)}, ${round(layer.bounds.cy, 2)}]`,
    `draw ${start}-${end}`,
    `fill ${end - 4}-${end + 8}`,
    `stroke-out ${end}-${end + 10}`,
  ].join(' ');
});
console.log(report.join('\n'));
console.log(`\nwrote ${outFile}`);
console.log(`wrote ${darkOutFile}`);
