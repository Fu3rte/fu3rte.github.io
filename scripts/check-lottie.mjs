// Brook Lottie 产物自检：静态服务 + Playwright 无头 Chromium + 像素级比对
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const shotsDir = join(root, '.shots');
const jsonPath = join(root, 'public', 'lottie', 'brook-load.json');
const previewPath = '.demo/lottie-preview.html';

// op:222 是排他边界，最后可见帧是 221
const frames = [20, 45, 66, 120, 168, 221];
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.css': 'text/css; charset=utf-8',
};

mkdirSync(shotsDir, { recursive: true });

// 只读静态服务，避免 file:// 下 fetch/XHR 被浏览器拦掉
const server = createServer(async (request, response) => {
  const relative = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname).slice(1);
  const target = resolve(root, relative.split('/').join(sep));
  if (!target.startsWith(root + sep)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  try {
    const body = await readFile(target);
    response.writeHead(200, { 'content-type': types[extname(target)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end('not found');
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;

const report = [];
const log = (line) => {
  report.push(line);
  console.log(line);
};

// ---------- 1. JSON 结构断言 ----------
const animation = JSON.parse(await readFile(jsonPath, 'utf8'));
assert.equal(animation.v, '5.7.4');
assert.equal(animation.fr, 60);
assert.equal(animation.op, 222);
assert.equal(animation.layers.length, 6, '图层数量必须为 6');
assert.deepEqual(
  animation.layers.map((layer) => layer.nm),
  ['left-eye', 'right-eye', 'nose', 'skull', 'hair-hat', 'cane'],
  '图层自顶向下顺序',
);
for (const layer of animation.layers) {
  assert.equal(layer.ty, 4, `${layer.nm}: shape layer`);
  assert.deepEqual([layer.ip, layer.op, layer.st, layer.bm], [0, 222, 0, 0], `${layer.nm}: 时间轴`);
  assert.equal(layer.shapes.length, 1, `${layer.nm}: 单个 group`);
  const group = layer.shapes[0];
  assert.equal(group.ty, 'gr', `${layer.nm}: ty gr`);
  const kinds = group.it.map((item) => item.ty);
  const expected = layer.nm === 'cane'
    ? ['sh', 'sh', 'tm', 'st', 'fl', 'tr']
    : ['sh', 'tm', 'st', 'fl', 'tr'];
  assert.deepEqual(kinds, expected, `${layer.nm}: group 内 sh/tm/st/fl/tr 齐备`);
  const trim = group.it.find((item) => item.ty === 'tm');
  assert.equal(trim.m, 1, `${layer.nm}: trim 为 normal`);
  assert.equal(trim.s.a, 0);
  assert.equal(trim.o.a, 0);
  assert.equal(trim.e.k[0].s[0], 0, `${layer.nm}: trim 起点 0`);
  assert.equal(trim.e.k[trim.e.k.length - 1].s[0], 100, `${layer.nm}: trim 终点 100`);
  const stroke = group.it.find((item) => item.ty === 'st');
  const fill = group.it.find((item) => item.ty === 'fl');
  assert.equal(stroke.w.k, 3, `${layer.nm}: 描边宽度 3`);
  assert.equal(stroke.c.a, 0, `${layer.nm}: 描边颜色为静态属性`);
  assert.equal(stroke.c.k.length, 4, `${layer.nm}: 描边颜色带 alpha`);
  assert.equal(fill.c.k.length, 4, `${layer.nm}: 填色颜色带 alpha`);
}
const windowTable = animation.layers.map((layer) => {
  const trim = layer.shapes[0].it.find((item) => item.ty === 'tm');
  const fill = layer.shapes[0].it.find((item) => item.ty === 'fl');
  const stroke = layer.shapes[0].it.find((item) => item.ty === 'st');
  return `${layer.nm.padEnd(9)} draw ${trim.e.k[0].t}->${trim.e.k[1].t}  fill ${fill.o.k[0].t}->${fill.o.k[1].t}  stroke-out ${stroke.o.k[0].t}->${stroke.o.k[1].t}  anchor [${layer.ks.a.k[0]}, ${layer.ks.a.k[1]}]`;
});
log('== 帧表 ==');
windowTable.forEach(log);

// 循环接缝：66 与 222 的每条动画关键帧值必须逐项相等
const seam = animation.layers.map((layer) => {
  const at = (property, time) => {
    if (property.a === 0) return property.k;
    const key = property.k.find((entry) => entry.t === time);
    return key ? key.s : null;
  };
  const rows = [];
  for (const name of ['p', 'r', 's']) {
    const property = layer.ks[name];
    const start = at(property, 66);
    const end = at(property, 222);
    if (property.a === 1) {
      assert(start && end, `${layer.nm}: ks.${name} 缺少 66 或 222 关键帧`);
      assert.deepEqual(start, end, `${layer.nm}: ks.${name} 循环首尾值不等 ${start} vs ${end}`);
    }
    rows.push(`${name}=${JSON.stringify(start)}`);
  }
  const group = layer.shapes[0].it;
  for (const item of group) {
    if (item.ty === 'tm' || item.ty === 'st' || item.ty === 'fl') {
      const property = item.ty === 'tm' ? item.e : item.o;
      const last = property.k[property.k.length - 1];
      assert(last.t <= 66, `${layer.nm}: ${item.ty} 在 66 之后仍有关键帧`);
      rows.push(`${item.ty}=${last.s[0]}`);
    }
  }
  return `${layer.nm.padEnd(9)} 接缝 ${rows.join(' ')}`;
});
log('== 循环接缝（66 与 222 数值一致）==');
seam.forEach(log);

// 组装段的拐杖自转：一整圈只在 0-66 帧之间跑完，循环段从 360° 接着摆
const caneRotation = animation.layers.find(layer => layer.nm === 'cane').ks.r;
const spinStops = caneRotation.k.filter(key => key.t < 66);
assert.deepEqual(
  spinStops.map(key => [key.t, key.s[0]]),
  [[24, 0], [58, 360]],
  'cane: 组装段内没有转完 360°',
);
log(`拐杖自转 ${spinStops[0].t}->${spinStops[1].t} 帧（0->360°）`);

// ---------- 2. 浏览器渲染 + 截图 ----------
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 700 } });
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('requestfailed', (request) => errors.push(`requestfailed: ${request.url()}`));

await page.goto(`${origin}/${previewPath}`, { waitUntil: 'load' });
await page.evaluate(() => window.ready);

const strokeState = (frame) => page.evaluate((target) => {
  window.seek(target);
  return Array.from(document.querySelectorAll('.lottie svg [stroke-opacity]')).map((el) => Number(el.getAttribute('stroke-opacity')));
}, frame);

const shotFiles = {};
for (const frame of frames) {
  const opacities = await strokeState(frame);
  const file = join(shotsDir, `lottie-${frame}.png`);
  await page.locator('.lottie svg').screenshot({ path: file });
  shotFiles[frame] = file;
  const max = opacities.length ? Math.max(...opacities) : 0;
  const settled = frame >= 66 ? max === 0 : max > 0;
  assert(opacities.length > 0, `frame ${frame}: 存在描边节点`);
  assert(settled, `frame ${frame}: 描边不透明度 ${opacities.join(',')} 未达预期`);
  log(`frame ${String(frame).padEnd(3)} 描边 ${opacities.length} 个，最大不透明度 ${max}，截图 .shots/lottie-${frame}.png`);
}

// 66 帧之后只剩填色：描边节点全部为 0
for (const frame of [67, 120, 221]) {
  const opacities = await strokeState(frame);
  assert.ok(opacities.every((value) => value === 0), `frame ${frame}: 描边未清零 ${opacities}`);
}

// op 排他：222 落在下一轮循环起点，播放器把图层隐藏，221 才是本轮最后可见帧
const boundary = await page.evaluate(() => {
  window.seek(222);
  const root = document.querySelector('.lottie svg > g');
  const layers = [...root.querySelectorAll(':scope > g')];
  return { total: layers.length, hidden: layers.filter((el) => el.style.display === 'none').length };
});
assert.equal(boundary.hidden, boundary.total, `frame 222 应处于排他边界：${JSON.stringify(boundary)}`);
log(`排他边界 frame 222：图层 ${boundary.total} 个全部隐藏，最后可见帧取 221`);

// ---------- 3. 循环首尾无缝：221 与 66 逐像素比对 ----------
const compare = async (leftFrame, rightFrame) => page.evaluate(async ([left, right]) => {
  const load = (src) => new Promise((done, fail) => {
    const image = new Image();
    image.onload = () => done(image);
    image.onerror = () => fail(new Error('截图解码失败'));
    image.src = src;
  });
  const grab = async (src) => {
    const image = await load(src);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fefefe';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  };
  const a = await grab(left);
  const b = await grab(right);
  if (a.width !== b.width || a.height !== b.height) throw new Error('两张截图尺寸不一致');
  let sum = 0;
  let changed = 0;
  let maxDelta = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const deltas = [
      Math.abs(a.data[i] - b.data[i]),
      Math.abs(a.data[i + 1] - b.data[i + 1]),
      Math.abs(a.data[i + 2] - b.data[i + 2]),
    ];
    const peak = Math.max(...deltas);
    maxDelta = Math.max(maxDelta, peak);
    sum += deltas[0] + deltas[1] + deltas[2];
    if (peak > 8) changed += 1;
  }
  const pixels = a.width * a.height;
  return {
    width: a.width,
    height: a.height,
    pixels,
    meanAbsPercent: (sum / (pixels * 3 * 255)) * 100,
    changedRatioPercent: (changed / pixels) * 100,
    maxDelta,
  };
}, [
  `data:image/png;base64,${(await readFile(shotFiles[leftFrame])).toString('base64')}`,
  `data:image/png;base64,${(await readFile(shotFiles[rightFrame])).toString('base64')}`,
]);

const loop = await compare(66, 221);
log(`循环首尾 66 vs 221：${loop.width}x${loop.height}，平均绝对差 ${loop.meanAbsPercent.toFixed(4)}%，变化像素 ${loop.changedRatioPercent.toFixed(4)}%，最大通道差 ${loop.maxDelta}`);
assert(loop.changedRatioPercent < 0.5, `循环首尾变化像素 ${loop.changedRatioPercent}% >= 0.5%`);
assert(loop.meanAbsPercent < 0.5, `循环首尾平均差 ${loop.meanAbsPercent}% >= 0.5%`);

// ---------- 4. 几何保真：66 帧 Lottie vs 源 SVG ----------
const fidelity = await page.evaluate(async () => {
  const paint = async (markup) => {
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
    const image = await new Promise((done, fail) => {
      const node = new Image();
      node.onload = () => done(node);
      node.onerror = () => fail(new Error('svg 解码失败'));
      node.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 626;
    canvas.height = 626;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fefefe';
    context.fillRect(0, 0, 626, 626);
    context.drawImage(image, 0, 0, 626, 626);
    URL.revokeObjectURL(url);
    return context.getImageData(0, 0, 626, 626);
  };

  window.seek(66);
  const live = document.querySelector('.lottie svg').cloneNode(true);
  live.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  live.setAttribute('width', '626');
  live.setAttribute('height', '626');
  const lottieData = await paint(new XMLSerializer().serializeToString(live));

  const html = await (await fetch('../.demo/brook-logo.html')).text();
  const source = new DOMParser().parseFromString(html, 'text/html').querySelector('svg');
  // 源文件的 #000 统一映射到站点令牌 #141414，保证只比几何与抗锯齿
  source.querySelectorAll('[fill]').forEach((node) => {
    if (node.getAttribute('fill') === '#000') node.setAttribute('fill', '#141414');
  });
  const sourceData = await paint(new XMLSerializer().serializeToString(source));

  let sum = 0;
  let changed = 0;
  let maxDelta = 0;
  const composite = document.createElement('canvas');
  composite.width = 626;
  composite.height = 626 * 3 + 16;
  const context = composite.getContext('2d');
  context.fillStyle = '#fefefe';
  context.fillRect(0, 0, composite.width, composite.height);
  const put = (data) => {
    const holder = document.createElement('canvas');
    holder.width = 626;
    holder.height = 626;
    holder.getContext('2d').putImageData(data, 0, 0);
    return holder;
  };
  const diff = new ImageData(new Uint8ClampedArray(sourceData.data.length), 626, 626);
  for (let i = 0; i < sourceData.data.length; i += 4) {
    const deltas = [
      Math.abs(sourceData.data[i] - lottieData.data[i]),
      Math.abs(sourceData.data[i + 1] - lottieData.data[i + 1]),
      Math.abs(sourceData.data[i + 2] - lottieData.data[i + 2]),
    ];
    const peak = Math.max(...deltas);
    maxDelta = Math.max(maxDelta, peak);
    sum += deltas[0] + deltas[1] + deltas[2];
    if (peak > 8) changed += 1;
    const level = Math.min(255, peak * 10);
    diff.data[i] = level;
    diff.data[i + 1] = level;
    diff.data[i + 2] = level;
    diff.data[i + 3] = 255;
  }
  context.drawImage(put(sourceData), 0, 0);
  context.drawImage(put(lottieData), 0, 626 + 8);
  context.drawImage(put(diff), 0, (626 + 8) * 2);
  const pixels = 626 * 626;
  return {
    meanAbsPercent: (sum / (pixels * 3 * 255)) * 100,
    changedRatioPercent: (changed / pixels) * 100,
    maxDelta,
    png: composite.toDataURL('image/png'),
  };
});
await writeFile(join(shotsDir, 'lottie-vs-source.png'), Buffer.from(fidelity.png.split(',')[1], 'base64'));
log(`几何保真 66 帧 vs 源 SVG：平均绝对差 ${fidelity.meanAbsPercent.toFixed(4)}%，变化像素 ${fidelity.changedRatioPercent.toFixed(4)}%，最大通道差 ${fidelity.maxDelta}，合成图 .shots/lottie-vs-source.png`);
assert(fidelity.meanAbsPercent < 1, `与源 SVG 平均差 ${fidelity.meanAbsPercent}% 过高`);
assert(fidelity.changedRatioPercent < 3, `与源 SVG 变化像素 ${fidelity.changedRatioPercent}% 过高`);

// ---------- 5. console 无 error ----------
await page.close();
await browser.close();
server.close();
assert.deepEqual(errors, [], `浏览器错误：${JSON.stringify(errors)}`);
log(`console/pageerror：${errors.length} 条`);
log(`\nlottie-check: PASS（${report.length} 行输出，${errors.length} 错误）`);
