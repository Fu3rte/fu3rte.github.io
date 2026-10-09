// 生成咖啡热气：两缕波浪线各自上升一次、错开半个周期，接缝处两缕同时透明
// 字段口径对齐 public/lottie/brook-load.json：路径属性键名是 ks，缓动的 x/y 一律写成数组
// 波形本身保持静态，摆动靠 position 的横向关键帧——lottie 对 a:1 的 sh 关键帧会插出 NaN
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outFile = join(root, 'public', 'lottie', 'steam.json');

const FPS = 60;
const RISE = 90; // 单缕热气走完画布所用的帧数
const CYCLE = RISE * 2; // 两缕各占半周期，整段 3s 无缝循环
const W = 150;
const H = 190;
const HALF = 70; // 波浪路径自身的半高，出画行程按它算
const TRAVEL = H + 2 * HALF; // 层心从画布下方外沿走到上方外沿的总行程
const CX = W / 2;

const ink = [0x14 / 255, 0x14 / 255, 0x14 / 255, 1];
const linear = { i: { x: [0.833, 0.833], y: [0.833, 0.833] }, o: { x: [0.167, 0.167], y: [0.167, 0.167] } };
const smooth = { i: { x: [0.4, 0.4], y: [1, 1] }, o: { x: [0.6, 0.6], y: [0, 0] } };

// 五个共线顶点靠进出切线顶成正弦波
const wave = amplitude => ({
  c: false,
  v: [[0, -HALF], [0, -HALF / 2], [0, 0], [0, HALF / 2], [0, HALF]],
  i: [[0, 0], [-amplitude, 0], [amplitude, 0], [-amplitude, 0], [0, 0]],
  o: [[0, 16], [amplitude, 0], [-amplitude, 0], [amplitude, 0], [0, 0]],
});

const layer = (index, start, amplitude, width, sway) => ({
  ddd: 0,
  ind: index,
  ty: 4,
  nm: `steam-${index}`,
  sr: 1,
  ks: {
    a: { a: 0, k: [0, 0] },
    o: {
      a: 1,
      k: [
        { ...smooth, t: 0, s: [0] },
        { ...smooth, t: start, s: [0] },
        { ...smooth, t: start + 16, s: [100] },
        { ...smooth, t: start + RISE - 20, s: [100] },
        { t: start + RISE, s: [0] },
      ],
    },
    r: { a: 0, k: 0 },
    p: {
      a: 1,
      k: [
        { ...linear, t: start, s: [CX, H + HALF] },
        { ...linear, t: start + RISE / 3, s: [CX + sway, H + HALF - TRAVEL / 3] },
        { ...linear, t: start + (RISE * 2) / 3, s: [CX - sway, H + HALF - (TRAVEL * 2) / 3] },
        { t: start + RISE, s: [CX, -HALF] },
      ],
    },
    s: { a: 0, k: [100, 100] },
  },
  ao: 0,
  shapes: [{
    ty: 'gr',
    nm: 'wave',
    it: [
      { ty: 'sh', nm: 'path', ks: { a: 0, k: wave(amplitude) } },
      {
        ty: 'st',
        nm: 'ink',
        c: { a: 0, k: ink },
        o: { a: 0, k: 100 },
        w: { a: 0, k: width },
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
});

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
  layers: [layer(1, 0, 22, 9, 7), layer(2, RISE, 15, 8, -9)],
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(animation, null, 2)}\n`, 'utf8');
console.log(`wrote ${outFile}: ${(CYCLE / FPS).toFixed(2)}s cycle, ${(RISE / FPS).toFixed(2)}s per wisp, ${W}x${H}`);
