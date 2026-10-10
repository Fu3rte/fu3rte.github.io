import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

// 眼窝由 hero-eyes.riv 承接：验转写与落位对得上原稿、眨眼真的发生、过程无页面异常
mkdirSync('.shots', { recursive: true });
const url = process.env.SHOT_URL ?? 'http://127.0.0.1:5199/';
const WATCH_MS = 16000;
// 取 skull 骨骼范围内的一扇窗，两边都只量眼窝的黑，避开兜帽内衬与太阳穴切角
// 477..777 × 500..620 是眼窝在画稿里的局部位置，采样窗跟着画稿的平移走
const eyeWindow = offset => ({ x0: offset + 477, y0: 500, x1: offset + 777, y1: 620 });

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await page.goto(url, { waitUntil: 'load' });
await page.waitForSelector('.brook-scene.eyes-live', { timeout: 30000 });

const WINDOW = eyeWindow(await page.evaluate(() => {
  const [t] = document.querySelector('.brook-scene > svg > g').transform.baseVal;
  return Math.round(t.matrix.e);
}));

const compare = await page.evaluate(async (win) => {
  const scene = document.querySelector('.brook-scene');
  const svg = scene.querySelector('svg');
  const canvas = scene.querySelector('.brook-eyes');
  const W = 850;
  const H = Math.round((W * 1254) / 2198);
  const k = W / 2198;
  const rect = {
    x: Math.round(win.x0 * k),
    y: Math.round(win.y0 * k),
    width: Math.round((win.x1 - win.x0) * k),
    height: Math.round((win.y1 - win.y0) * k),
  };
  const stats = (ctx) => {
    const { data } = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
    let dark = 0;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 8 || data[i] + data[i + 1] + data[i + 2] > 150) continue;
      dark += 1;
      const px = (i / 4) % rect.width;
      const py = Math.floor(i / 4 / rect.width);
      minX = Math.min(minX, px); minY = Math.min(minY, py);
      maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
    }
    return { dark, box: [minX, minY, maxX, maxY].map((v) => Math.round(v / k)) };
  };
  const surface = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  };

  const fromCanvas = surface().getContext('2d');
  fromCanvas.drawImage(canvas, 0, 0, W, H);
  const riv = stats(fromCanvas);

  scene.classList.remove('eyes-live');
  const clone = svg.cloneNode(true);
  // 采样落在动画的任意一拍上，先剥掉运行时变换，两边比的才是同一姿态
  clone.querySelector('#skull')?.removeAttribute('transform');
  clone.setAttribute('width', W);
  clone.setAttribute('height', H);
  const href = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  const img = await new Promise((resolve, reject) => {
    const node = new Image();
    node.onload = () => resolve(node);
    node.onerror = () => reject(new Error('原稿栅格化失败'));
    node.src = href;
  });
  const fromSvg = surface().getContext('2d');
  fromSvg.drawImage(img, 0, 0, W, H);
  const svgStats = stats(fromSvg);
  URL.revokeObjectURL(href);
  scene.classList.add('eyes-live');

  return { riv, svg: svgStats, scale: k };
}, WINDOW);

const toArtboard = (box) => [box[0] + WINDOW.x0, box[1] + WINDOW.y0, box[2] + WINDOW.x0, box[3] + WINDOW.y0];
const a = toArtboard(compare.riv.box);
const b = toArtboard(compare.svg.box);
const drift = [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]];
const inkGap = Math.abs(compare.riv.dark - compare.svg.dark) / compare.svg.dark;
assert.ok(
  drift.every((v) => Math.abs(v) <= 2) && inkGap < 0.06,
  `眼窝与原稿不一致：偏移 ${drift.join(', ')}（画框坐标），墨量差 ${(inkGap * 100).toFixed(1)}%`,
);

// 眨眼行为：画布里的暗像素先跌到张开态一半以下，再回到八成以上
const series = await page.evaluate(
  async ({ watch, win }) => {
    const canvas = document.querySelector('.brook-eyes');
    const ctx = canvas.getContext('2d');
    const k = canvas.width / 2198;
    const rect = {
      x: Math.round(win.x0 * k),
      y: Math.round(win.y0 * k),
      width: Math.round((win.x1 - win.x0) * k),
      height: Math.round((win.y1 - win.y0) * k),
    };
    const darkCount = () => {
      const { data } = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
      let dark = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 8 && data[i] + data[i + 1] + data[i + 2] <= 150) dark += 1;
      }
      return dark;
    };
    const out = [];
    await new Promise((resolve) => {
      const t0 = performance.now();
      const tick = () => {
        const at = performance.now() - t0;
        out.push([Math.round(at), darkCount()]);
        if (at >= watch) resolve();
        else requestAnimationFrame(tick);
      };
      tick();
    });
    return out;
  },
  { watch: WATCH_MS, win: WINDOW },
);

const open = Math.max(...series.map((p) => p[1]));
let blinks = 0;
let closed = false;
for (const [, dark] of series) {
  if (!closed && dark < open * 0.5) closed = true;
  else if (closed && dark > open * 0.8) {
    closed = false;
    blinks += 1;
  }
}
assert.ok(blinks >= 2, `${WATCH_MS}ms 内只捕捉到 ${blinks} 次眨眼`);

await page.locator('.brook-scene').screenshot({ path: '.shots/eyes-open.png' });
await page.close();
await browser.close();
assert.deepEqual(errors, [], `页面报错：${errors.join(' | ')}`);
console.log(
  JSON.stringify({ drift, inkGap: `${(inkGap * 100).toFixed(2)}%`, blinks, openDarkPx: open, sampledMs: series.at(-1)[0] }, null, 1),
);
