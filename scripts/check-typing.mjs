import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

// 敲键盘循环：机身与头颅都不参与敲击，动作只在前臂；颅骨保留呼吸且与眼窝画布同速、循环逐拍复现
mkdirSync('.shots', { recursive: true });
const url = process.env.SHOT_URL ?? 'http://127.0.0.1:5207/';
const CYCLE_MS = 5400;
const WATCH_MS = 12500;
const LID = '#laptop > :not(#hinges):not(#laptop-base)';

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text());
});

await page.goto(url, { waitUntil: 'load' });
await page.waitForSelector('.brook-scene.eyes-live', { timeout: 30000 });

const series = await page.evaluate(
  async ({ watch, lidSelector }) => {
    const svg = document.querySelector('.brook-scene > svg');
    const skull = document.querySelector('#skull');
    const canvas = document.querySelector('.brook-eyes');
    const sleeves = ['#left-sleeve', '#right-sleeve'].map(s => document.querySelector(s));
    const lid = [...document.querySelectorAll(lidSelector)];
    // GSAP 把 SVG 变换写进 transform 属性、把 HTML 变换写进 style，无旋转时 matrix 的 f 分量即位移
    const ty = raw => {
      const m = /matrix\(([^)]+)\)/.exec(raw ?? '');
      return m ? Number(m[1].split(',')[5]) : 0;
    };
    const out = [];
    await new Promise(resolve => {
      const t0 = performance.now();
      const tick = () => {
        const at = performance.now() - t0;
        // 用户单位与 CSS px 各按自身缩放换算到屏幕像素，两条图层才谈得上同速
        out.push({
          at,
          lid: Math.max(...lid.map(el => Math.abs(ty(el.getAttribute('transform'))))),
          skullPx: ty(skull.getAttribute('transform')) * svg.getScreenCTM().d,
          canvasPx: ty(getComputedStyle(canvas).transform) * (canvas.getBoundingClientRect().width / canvas.clientWidth),
          sleeves: sleeves.map(s => ty(s.getAttribute('transform'))),
        });
        if (at >= watch) resolve();
        else requestAnimationFrame(tick);
      };
      tick();
    });
    return out;
  },
  { watch: WATCH_MS, lidSelector: LID },
);

const peakOf = pick => Math.max(...series.map(pick));
const half = Math.floor(series.length / 2);
const lidMax = peakOf(r => r.lid);
const headSwing = peakOf(r => r.skullPx) - Math.min(...series.map(r => r.skullPx));
// 呼吸的速度上限是 3 用户单位 × 2π / 5.4s，掺进点头会立刻翻好几倍
const headVel = Math.max(
  ...series.slice(1).map((r, i) => Math.abs(r.skullPx - series[i].skullPx) / ((r.at - series[i].at) / 1000)),
);
const sleevePeaks = [0, 1].map(i => peakOf(r => r.sleeves[i]));
const syncGap = Math.max(...series.map(r => Math.abs(r.skullPx - r.canvasPx)));
// 两半各自的最重一拍都要够深，才谈得上逐拍复现；单帧采样对峰值有 ±2 的抖动，比差值比的是下限
const sleeveFloor = Math.min(
  ...[series.slice(0, half), series.slice(half)].flatMap(rows =>
    [0, 1].map(i => Math.max(...rows.map(r => r.sleeves[i]))),
  ),
);

assert(lidMax === 0, `机身动了 ${lidMax.toFixed(2)} 用户单位，电脑不该抖`);
assert(headVel < 3, `颅骨每秒位移到 ${headVel.toFixed(2)}px，头在跟着敲击抖`);
assert(headSwing > 0.8, `颅骨起伏只有 ${headSwing.toFixed(2)}px，呼吸没有发生`);
assert(
  sleevePeaks.every(peak => peak > 4.5),
  `前臂没有跟着动：左 ${sleevePeaks[0].toFixed(2)}、右 ${sleevePeaks[1].toFixed(2)}`,
);
assert(syncGap < 0.35, `颅骨与眼窝画布位移差 ${syncGap.toFixed(2)}px，会脱节`);
assert(sleeveFloor > 5, `两半里最浅的一拍只到 ${sleeveFloor.toFixed(2)}，循环没有逐拍复现`);

// 按姿态等帧：前臂沉到最深的一拍与回到静拍的一拍各留一张
const poseShot = async (deep, file) => {
  await page.waitForFunction(
    ({ selector, want }) => {
      const [left, right] = selector.map(s => document.querySelector(s));
      const ty = el => {
        const m = /matrix\(([^)]+)\)/.exec(el.getAttribute('transform') ?? '');
        return m ? Number(m[1].split(',')[5]) : 0;
      };
      const dip = Math.max(ty(left), ty(right));
      return want === 'deep' ? dip > 6 : dip < 0.1;
    },
    { selector: ['#left-sleeve', '#right-sleeve'], want: deep ? 'deep' : 'quiet' },
  );
  await page.locator('.brook-scene').screenshot({ path: file });
};
await poseShot(true, '.shots/typing-deep.png');
await poseShot(false, '.shots/typing-quiet.png');
await page.close();

// 降低动效偏好下整段编排从头到尾不启动
const stillPage = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await stillPage.goto(url, { waitUntil: 'load' });
await stillPage.waitForSelector('.brook-scene');
await stillPage.waitForFunction(() => document.getElementById('brook-loader')?.classList.contains('is-hidden'));
await stillPage.waitForTimeout(3000);
const untouched = await stillPage.evaluate(selector => {
  const moved = [document.querySelector('#skull'), ...document.querySelectorAll(selector)];
  return moved.filter(el => /matrix|translate\(/.test(el.getAttribute('transform') ?? '')).length;
}, LID);
assert.equal(untouched, 0, 'reduced motion 下机身与颅骨不该带任何变换');
await stillPage.close();

await browser.close();
console.log(
  JSON.stringify(
    {
      lidMax,
      headSwing: Number(headSwing.toFixed(2)),
      headVel: Number(headVel.toFixed(2)),
      sleevePeaks: sleevePeaks.map(v => Number(v.toFixed(2))),
      syncGap: Number(syncGap.toFixed(3)),
      sleeveFloor: Number(sleeveFloor.toFixed(2)),
      sampledFrames: series.length,
    },
    null,
    1,
  ),
);
assert.deepEqual(errors, [], `页面报错：${errors.join(' | ')}`);
