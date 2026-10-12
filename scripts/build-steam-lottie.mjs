// 生成咖啡热气：三缕错相位的热气，每缕四段上升短弧，段在杯口生成、上升中摆幅与线宽张开、出顶前散掉
// 单段行程即循环周期，四段各错 1/4 周期，任意时刻每缕都有四段分布在不同高度，接缝处两卷同时透明
// 字段口径对齐 public/lottie/brook-load.json：路径属性键名是 ks，缓动的 x/y 一律写成数组
// 路径本身保持静态，摆动靠 position 关键帧——lottie 对 a:1 的 sh 关键帧会插出 NaN
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outFile = join(root, 'public', 'lottie', 'steam.json');
const darkOutFile = join(root, 'public', 'lottie', 'steam.dark.json');

const FPS = 60;
const W = 150;
const H = 190; // 画布底边与杯口齐平（.brook-steam 按画框百分比落位）
const CYCLE = 160;
const PIECES = 4;
const PHASE = CYCLE / PIECES;
const SAMPLE = 16; // 每条轨迹的关键帧间隔（帧）
const FADE_IN = 0.28; // 行程比例走到这里时透明度到顶
const FADE_HOLD = 0.42; // 从这里开始稀释
const FADE_OUT = 0.72; // 归零点：段整体还在画布内就散完，顶部不留硬切

const ink = [0x14 / 255, 0x14 / 255, 0x14 / 255, 1];
// 深色主题的 --ink：#ecebe7
const night = [0xec / 255, 0xeb / 255, 0xe7 / 255, 1];
const linear = { i: { x: [0.833, 0.833], y: [0.833, 0.833] }, o: { x: [0.167, 0.167], y: [0.167, 0.167] } };

// 把沿 y 参数化的正弦按 Hermite 转三次贝塞尔采样，得到一段自身带波浪的短弧
const arcPath = (halfHeight, amplitude, waves, phase) => {
  const steps = 6;
  const dv = (2 * halfHeight) / steps;
  const k = 2 * Math.PI * waves;
  const v = [];
  const i = [];
  const o = [];
  for (let s = 0; s <= steps; s += 1) {
    const t = s / steps;
    const slope = (amplitude * k * Math.cos(k * t + phase)) / (2 * halfHeight);
    v.push([amplitude * Math.sin(k * t + phase), -halfHeight + s * dv]);
    i.push(s === 0 ? [0, 0] : [-slope * dv / 3, -dv / 3]);
    o.push(s === steps ? [0, 0] : [slope * dv / 3, dv / 3]);
  }
  return { c: false, v, i, o };
};

const smoothstep = t => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

const opacityAt = (q, peak) => {
  if (q <= 0 || q >= FADE_OUT) return 0;
  if (q < FADE_IN) return peak * smoothstep(q / FADE_IN);
  if (q > FADE_HOLD) return peak * (1 - smoothstep((q - FADE_HOLD) / (FADE_OUT - FADE_HOLD)));
  return peak;
};

// 三缕的骨架：起势横向落点 sx、散开后的落点 cx、随高度平方增长的侧飘、摆幅张开区间、波浪周期数、初相、弧本身
// 弧自带一个可见的单向弯（amp/waves 决定），段心的侧飘幅度随高度张开，两样合起来才是"散"而不是"竖着长的一根"
const WISPS = [
  { sx: 62, cx: 46, drift: -16, cycles: 0.7, theta: 0.4, amp0: 5, amp1: 15, peak: 52, offset: 0, arc: [30, 6, 0.55, 0.6] },
  { sx: 76, cx: 76, drift: 3, cycles: 0.85, theta: 2.4, amp0: 6, amp1: 21, peak: 62, offset: 17, arc: [34, 6.5, 0.6, 2.1] },
  { sx: 90, cx: 106, drift: 16, cycles: 0.6, theta: 4.4, amp0: 5, amp1: 13, peak: 46, offset: 34, arc: [28, 5, 0.5, 4.0] },
];

// 行程比例 q 上的轨迹状态：q=0 段心在画布底边外，q=1 走到顶边外
// piece 只用来打散同缕内四段的弧相与摆幅，避免它们叠成一根柱子
const trackAt = (wisp, q, piece) => {
  const [hh, arcAmp, arcWaves, arcPhase] = wisp.arc;
  const sway = (wisp.amp0 + (wisp.amp1 - wisp.amp0) * q) * (0.85 + 0.12 * piece);
  const fan = wisp.sx + (wisp.cx - wisp.sx) * q ** 0.8;
  return {
    x: fan + wisp.drift * q * q + sway * Math.sin(2 * Math.PI * wisp.cycles * q + wisp.theta + piece * 0.5),
    y: H + hh - q * (H + 2 * hh),
    opacity: opacityAt(q, wisp.peak),
    width: 4 + 4 * q,
    arc: [hh, arcAmp * (0.85 + 0.12 * piece), arcWaves, arcPhase + piece * 1.7],
  };
};

const sampleTimes = phase => {
  const times = new Set();
  for (let t = 0; t <= CYCLE; t += SAMPLE) times.add(t);
  times.add(CYCLE - phase); // 回卷点落在采样点上：卷前后都透明，段跳回杯口才看不出来
  return [...times].sort((a, b) => a - b);
};

const animated = (wisp, phase, piece, pick) => {
  const times = sampleTimes(phase);
  const value = t => pick(trackAt(wisp, ((t + phase) % CYCLE) / CYCLE, piece));
  return {
    a: 1,
    k: times.map((t, index) => {
      const key = { t, s: [value(t)], ...linear };
      if (index === times.length - 1) {
        delete key.o;
        delete key.i;
      }
      return key;
    }),
  };
};

const animatedPoint = (wisp, phase, piece) => {
  const times = sampleTimes(phase);
  return {
    a: 1,
    k: times.map((t, index) => {
      const { x, y } = trackAt(wisp, ((t + phase) % CYCLE) / CYCLE, piece);
      const key = { t, s: [x, y], ...linear };
      if (index === times.length - 1) {
        delete key.o;
        delete key.i;
      }
      return key;
    }),
  };
};

const pieceLayer = (wisp, piece, ind) => {
  const phase = (wisp.offset + piece * PHASE) % CYCLE;
  const { arc: [hh, arcAmp, arcWaves, arcPhase] } = trackAt(wisp, 0, piece);
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: `steam-${ind}`,
    sr: 1,
    ks: {
      a: { a: 0, k: [0, 0] },
      o: animated(wisp, phase, piece, track => track.opacity),
      r: { a: 0, k: 0 },
      p: animatedPoint(wisp, phase, piece),
      s: { a: 0, k: [100, 100] },
    },
    ao: 0,
    shapes: [{
      ty: 'gr',
      nm: 'wisp',
      it: [
        { ty: 'sh', nm: 'arc', ks: { a: 0, k: arcPath(hh, arcAmp, arcWaves, arcPhase) } },
        {
          ty: 'st',
          nm: 'ink',
          c: { a: 0, k: ink },
          o: { a: 0, k: 100 },
          w: animated(wisp, phase, piece, track => track.width),
          lc: 2,
          lj: 2,
        },
        {
          ty: 'tr',
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
      ],
    }],
    ip: 0,
    op: CYCLE,
    st: 0,
    bm: 0,
  };
};

const layers = WISPS.flatMap((wisp, w) =>
  Array.from({ length: PIECES }, (_, piece) => pieceLayer(wisp, piece, w * PIECES + piece + 1))
);

const animation = {
  v: '5.7.4',
  fr: FPS,
  ip: 0,
  op: CYCLE,
  w: W,
  h: H,
  nm: 'steam',
  ddd: 0,
  assets: [],
  layers,
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(animation, null, 2)}\n`, 'utf8');
// 深色主题下热气改用反相墨色的变体，轨迹与节奏逐帧相同
const darkAnimation = JSON.parse(
  JSON.stringify(animation).replaceAll(JSON.stringify(ink), JSON.stringify(night)),
);
writeFileSync(darkOutFile, `${JSON.stringify(darkAnimation, null, 2)}\n`, 'utf8');
console.log(`wrote ${outFile}: ${(CYCLE / FPS).toFixed(2)}s cycle, ${WISPS.length} wisps x ${PIECES} pieces, ${W}x${H}`);
console.log(`wrote ${darkOutFile}`);
