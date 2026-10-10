import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { chromium } from 'playwright';

mkdirSync('.shots', { recursive: true });
const url = process.env.SHOT_URL ?? 'http://127.0.0.1:5182/';
const origin = new URL(url).origin;
const errors = [];
const checks = [];
const browser = await chromium.launch();

// works 的正文来自 api.github.com，匿名配额按 IP 计 60 次/小时。
// 验收走 gh 的鉴权通道取一次真实响应，再喂给应用自己的缓存，测试不再随配额抖动
const stickerRepos = ['Fit-Agent', 'contextus', 'dsh-sight'];
const repoFields = ['name', 'html_url', 'language'];
const repoFixture = '.shots/repos.json';
const run = promisify(execFile);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// 连发三次 gh 会偶发连接重置，重试到第三次仍失败就照旧崩
const ghJson = async path => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return JSON.parse((await run('gh', ['api', path])).stdout);
    } catch (error) {
      if (attempt === 3) throw error;
      await sleep(400 * attempt);
    }
  }
};

const loadRepos = async () => {
  const cached = existsSync(repoFixture) ? JSON.parse(readFileSync(repoFixture, 'utf8')) : null;
  // 应用侧缓存一小时过期，取物比它更早一步换新，避免种子被当成过期数据丢掉
  if (cached && Date.now() - cached.at < 45 * 60 * 1000) return cached.repos;
  const repos = [];
  for (const name of stickerRepos) {
    const raw = await ghJson(`repos/Fu3rte/${name}`);
    repos.push(Object.fromEntries(repoFields.map(field => [field, raw[field]])));
    await sleep(250);
  }
  writeFileSync(repoFixture, JSON.stringify({ at: Date.now(), repos }));
  return repos;
};

const repos = await loadRepos();

// 单入口 SPA：路由路径就是页面地址，尾斜杠由 normalizePath 收敛
const ready = {
  '/': '.brook-scene',
  '/photos': '.photos-grid img',
  '/contact': '.contact-big',
};

const attach = page => {
  page.on('pageerror', error => errors.push(error.message));
  // 只把页面异常与同源资源失败算作应用错误；第三方字体 CDN 的可达性不受应用控制
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) errors.push(message.text());
  });
  page.on('requestfailed', request => {
    if (request.url().startsWith(origin)) errors.push(`requestfailed ${request.url()}`);
  });
  return page;
};

// 覆盖层每放一次行就记一拍时间戳：SPA 只有一次文档加载，路由切换全靠观测 is-hidden
const observeLoader = () => {
  window.__loaderHids = [];
  const watch = el => {
    let hidden = el.classList.contains('is-hidden');
    if (hidden) window.__loaderHids.push(Math.round(performance.now()));
    new MutationObserver(() => {
      const next = el.classList.contains('is-hidden');
      if (next && !hidden) window.__loaderHids.push(Math.round(performance.now()));
      hidden = next;
    }).observe(el, { attributeFilter: ['class'] });
  };
  const overlay = document.getElementById('brook-loader');
  if (overlay) {
    watch(overlay);
    return;
  }
  // initScript 早于 HTML 解析，documentElement 还不在，挂在 document 上等骨架出现
  const boot = new MutationObserver(() => {
    const found = document.getElementById('brook-loader');
    if (!found) return;
    boot.disconnect();
    watch(found);
  });
  boot.observe(document, { childList: true, subtree: true });
};

// hero 挂的是 .demo/hooded_skull.html 抽出的原稿，断言整幅结构完整落地
const sceneParts = () => ({
  viewBox: document.querySelector('.brook-scene > svg').getAttribute('viewBox'),
  groups: [...document.querySelectorAll('.brook-scene > svg > g > g[id]')].map(g => g.id),
  paths: document.querySelectorAll('.brook-scene > svg path').length,
  art: document.querySelector('.brook-scene > svg > g').getAttribute('transform'),
  desk: document.querySelector('#brook-desk').getAttribute('d'),
  cup: document.querySelectorAll('#brook-props path').length,
  lamp: document.querySelector('#brook-lamp').getAttribute('transform'),
  // 热气盒的中心换算回画框用户单位，必须压在杯口上
  steam: (() => {
    const frame = document.querySelector('.brook-scene').getBoundingClientRect();
    const box = document.querySelector('.brook-steam').getBoundingClientRect();
    return Math.round((((box.left + box.right) / 2 - frame.left) / frame.width) * 2198);
  })(),
});

const open = async (options = {}, initial = {}, path = '/') => {
  const page = attach(await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'en-US', ...options }));
  await page.addInitScript(init => {
    localStorage.setItem('lang', init.lang ?? 'en');
    if (init.repos) localStorage.setItem('works.repos', JSON.stringify({ at: Date.now(), repos: init.repos }));
  }, initial);
  await page.goto(new URL(path, url).href, { waitUntil: 'networkidle' });
  await page.waitForSelector(ready[path]);
  // 覆盖层收走之前正文不可交互
  await page.waitForFunction(() => document.getElementById('brook-loader')?.classList.contains('is-hidden'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  return page;
};

// loading 页需要看首帧，不能用 networkidle
const openRaw = async (path = '/', options = {}, lang = 'en') => {
  const page = attach(await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'en-US', ...options }));
  await page.addInitScript(seed => {
    localStorage.setItem('lang', seed.lang);
    localStorage.setItem('works.repos', JSON.stringify({ at: Date.now(), repos: seed.repos }));
  }, { lang, repos });
  await page.addInitScript(observeLoader);
  await page.goto(new URL(path, url).href, { waitUntil: 'commit' });
  return page;
};

const size = locator => locator.evaluate(el => el.offsetHeight);
const visible = locator => locator.evaluate(el => getComputedStyle(el).visibility);
const barWidth = page => page.locator('.orb-bar-center').getAttribute('width').then(Number);

// 回弹曲线会掠过终值，展开/收起都以时间轴真正落位为等待条件
// offsetHeight 取布局高度，不受 hover 缩放影响
// reduced-motion 下 transition-property 初值为 all，visibility 的步进切换要等一拍
const settled = (page, opened) => page.waitForFunction(state => {
  const orb = document.querySelector('.orb');
  const center = document.querySelector('.orb-bar-center');
  const matrix = document.querySelector('.orb-wrap-top').transform.baseVal.consolidate()?.matrix;
  const angle = matrix ? (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI : 0;
  const height = orb.offsetHeight;
  const width = Number(center.getAttribute('width'));
  const cells = [...orb.querySelectorAll('.orb-cell')].map(el => getComputedStyle(el).visibility);
  return state
    ? orb.dataset.open === 'true'
      && Math.abs(height - orb.scrollHeight) < 0.5
      && width === 0
      && Math.abs(angle - 45) < 0.01
      && cells.every(value => value === 'visible')
    : orb.dataset.open === 'false'
      && Math.abs(height - document.querySelector('.orb-trigger').offsetHeight) < 0.5
      && Math.abs(width - 140) < 0.01
      && Math.abs(angle) < 0.01
      && cells.every(value => value === 'hidden');
}, opened);

// 悬浮球：折叠成圆形汉堡，点击展开为竖向胶囊菜单，Esc / 点击外部收起
const checkOrb = async (page, name, current) => {
  const root = page.locator('.orb');
  const trigger = page.locator('.orb-trigger');
  const cells = page.locator('.orb-cell');

  assert.equal(await root.getAttribute('data-open'), 'false', `${name}: starts collapsed`);
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false', `${name}: collapsed aria`);
  const closed = await size(root);
  assert(closed > 50 && closed < 70, `${name}: collapsed height, got ${closed}`);
  assert.equal(await cells.count(), 3, `${name}: three routes`);
  assert.equal(await visible(cells.first()), 'hidden', `${name}: items hidden while collapsed`);
  assert.equal(await page.locator('.orb-item.is-current').getAttribute('href'), current, `${name}: current route`);

  await trigger.click();
  await settled(page, true);
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true', `${name}: expanded aria`);
  const expanded = await size(root);
  assert(expanded > closed + 100, `${name}: expands to a pill, got ${expanded}`);
  assert.equal(await visible(cells.first()), 'visible', `${name}: items revealed`);
  assert.equal(await barWidth(page), 0, `${name}: burger morphed to X`);
  const rotation = await page.locator('.orb-wrap-top').evaluate(el => {
    const matrix = el.transform.baseVal.consolidate()?.matrix;
    return matrix ? Math.round((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI) : 0;
  });
  assert.equal(rotation, 45, `${name}: top bar rotated into the X`);
  await page.screenshot({ path: `.shots/orb-${name}.png` });

  await page.keyboard.press('Escape');
  await settled(page, false);
  assert.equal(await visible(cells.first()), 'hidden', `${name}: items hidden again after Escape`);
  assert(Math.abs((await barWidth(page)) - 140) < 0.01, `${name}: X morphs back to burger`);
};

try {
  const cold = await openRaw('/', {}, 'en');
  // 冷启动：首帧就要压住正文，环形进度随真实就绪推进，最短驻留之后才擦除
  assert(
    await cold.evaluate(() => {
      const el = document.getElementById('brook-loader');
      return !!el && getComputedStyle(el).display !== 'none' && !el.classList.contains('is-hidden');
    }),
    'cold entry paints the overlay before the body exists',
  );
  await cold.waitForFunction(() => document.querySelectorAll('#brook-mark path').length >= 7);
  // offsetWidth 取布局宽度，与入场缩放无关，两段节奏量到的是同一个尺寸
  const coldMark = await cold.evaluate(() => document.querySelector('.brook-mark').offsetWidth);
  assert(coldMark > 200 && coldMark < 260, `the shared mark size sits between the old two, got ${coldMark}px`);
  assert(
    await cold.evaluate(() => !!document.querySelector('#brook-mark svg')),
    'the Lottie mark renders inside the overlay',
  );
  const markSnapshot = () => cold.evaluate(() => document.querySelector('#brook-mark svg').innerHTML);
  // 描边全部淡出即组装收束，此后的画面变化只可能来自 idle 循环
  // lottie 在循环段里插值出的残值以 1e-2 为界，逐位精确比对会随暂停帧漂走
  await cold.waitForFunction(() => {
    const strokes = [...document.querySelectorAll('#brook-mark [stroke-opacity]')];
    return strokes.length > 0 && strokes.every(el => Number(el.getAttribute('stroke-opacity')) < 0.01);
  });
  const firstFrame = await markSnapshot();
  await cold.waitForTimeout(420);
  assert.notEqual(await markSnapshot(), firstFrame, 'the idle loop keeps animating while waiting');
  await cold.screenshot({ path: '.shots/loader-cold.png' });
  await cold.waitForFunction(() => window.__loaderHids.length >= 1, null, { timeout: 10000 });
  const coldHid = await cold.evaluate(() => window.__loaderHids[0]);
  assert(coldHid >= 2000, `cold loader holds its minimum dwell, hid at ${coldHid}ms`);

  // 路由切换：同一份文档不发生加载，覆盖层摘掉 is-hidden 重新盖满，盖满那一拍换正文
  await cold.waitForSelector('.orb-item[href="/photos"]', { state: 'attached' });
  await cold.evaluate(() => {
    window.__clickAt = Math.round(performance.now());
    document.querySelector('.orb-item[href="/photos"]').click();
  });
  await cold.waitForFunction(() => !document.getElementById('brook-loader').classList.contains('is-hidden'));
  // 正文替换落在覆盖层盖满之后、放行之前，无人注视的那一拍
  await cold.waitForFunction(() => document.querySelectorAll('.photos-grid img').length === 10);
  const routeMark = await cold.evaluate(() => document.querySelector('.brook-mark').offsetWidth);
  assert.equal(routeMark, coldMark, 'every route switch replays the one loading skeleton');
  await cold.waitForFunction(() => window.__loaderHids.length >= 2, null, { timeout: 8000 });
  const switchHid = await cold.evaluate(() => window.__loaderHids[1] - window.__clickAt);
  assert(switchHid < 1800, `route switch stays brief, released ${switchHid}ms after the click`);
  assert.equal(await cold.evaluate(() => location.pathname), '/photos');
  assert.equal(await cold.evaluate(() => document.querySelectorAll('.brook-scene').length), 0, 'home unmounts on the covered beat');
  assert.equal(await cold.title(), 'Photos — Finnian');
  checks.push(`Loader: cold overlay hid at ${coldHid}ms, route switch released ${switchHid}ms after the click`);

  // 浏览器后退：popstate 直接换路由，覆盖层不再参与
  await cold.goBack();
  await cold.waitForFunction(() => location.pathname === '/');
  await cold.waitForSelector('.brook-scene');
  assert.equal(await cold.evaluate(() => window.__loaderHids.length), 2, 'back navigation replays no overlay');
  assert.equal(await cold.title(), 'Finnian — Animation & Interaction Portfolio');
  checks.push('Route switch swaps the body under the overlay; browser back returns to home instantly');
  await cold.close();

  // 降低动效偏好：静态徽标即时放行，路由切换直接落位，覆盖层从头到尾不盖回
  const still = await openRaw('/contact', { reducedMotion: 'reduce' });
  await still.waitForFunction(() => window.__loaderHids.length >= 1, null, { timeout: 15000 });
  // 放行时刻只按就绪度量，第三方字体链路的快慢不算进驻留时长
  const reduced = await still.evaluate(() => ({
    hid: window.__loaderHids[0],
    load: Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd),
  }));
  assert(
    reduced.hid - reduced.load < 400,
    `reduced motion releases on readiness, hid ${reduced.hid - reduced.load}ms after the load event`,
  );
  assert(
    await still.evaluate(() => !performance.getEntriesByType('resource').some(r => r.name.includes('brook-load.json'))),
    'reduced motion never downloads the animation asset',
  );
  await still.waitForSelector('.orb-item[href="/photos"]', { state: 'attached' });
  await still.evaluate(() => document.querySelector('.orb-item[href="/photos"]').click());
  await still.waitForFunction(
    () => location.pathname === '/photos' && document.querySelectorAll('.photos-grid img').length === 10,
    null,
    { timeout: 8000 },
  );
  assert.equal(await still.evaluate(() => window.__loaderHids.length), 1, 'reduced motion route switch never covers the screen');
  assert.equal(
    await still.evaluate(() => document.getElementById('brook-loader').classList.contains('is-hidden')),
    true,
    'reduced motion keeps the overlay hidden the whole time',
  );
  assert.equal(await still.title(), 'Photos — Finnian');
  checks.push(`Loader: reduced motion hid ${reduced.hid - reduced.load}ms after the load event, route switch lands without the overlay`);
  await still.close();

  // 降低动效下眼窝仍由原稿画着：既不起 Rive，也不去要 riv 与 wasm
  const stillHome = await openRaw('/', { reducedMotion: 'reduce' });
  await stillHome.waitForSelector('.brook-scene');
  await stillHome.waitForTimeout(2500);
  assert(
    await stillHome.evaluate(() => !performance.getEntriesByType('resource').some((r) => r.name.includes('/rive/'))),
    'reduced motion never downloads the eyes',
  );
  assert.notEqual(
    await stillHome.evaluate(() => getComputedStyle(document.getElementById('left-eye-socket')).display),
    'none',
    'reduced motion keeps the authored sockets',
  );
  await stillHome.close();

  const page = await open({}, { repos });
  // 兜帽骷髅原稿整幅挂进 1980x1254 画框，桌面一条直线，左侧一杯咖啡、右手边一盏台灯
  const box = await page.locator('.brook-scene > svg').boundingBox();
  assert(box && box.width > 400 && box.height > 250, `hooded skull must render, got ${JSON.stringify(box)}`);
  assert.deepEqual(await page.evaluate(sceneParts), {
    viewBox: '0 0 2198 1254',
    groups: ['background', 'sweatshirt', 'sleeves', 'hood-crown', 'hood-interior', 'skull', 'hood-lapels', 'laptop'],
    paths: 134,
    art: 'translate(472 0)',
    desk: 'M50 1150H2150',
    cup: 3,
    lamp: 'translate(1552 464.8) scale(0.6)',
    steam: 374,
  }, 'the authored hooded skull ships intact');
  // 台灯素材自带的画板白纸在站点侧收起，整幅只有方格纸一层底色
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.querySelector('#brook-lamp > rect')).display),
    'none',
    'the lamp brings no artboard background',
  );
  // 光锥的顶点必须落在灯口中心上：素材里 (246,350) 是发散点，(407.5,449) 是灯口椭圆面中心
  const anchorGap = await page.evaluate(() => {
    const svg = document.querySelector('.brook-scene > svg');
    const px = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width; // getCTM 落在 CSS px 上，换算回画框单位
    const groups = document.getElementById('brook-lamp').querySelectorAll(':scope > g');
    const apex = new DOMPoint(246, 350).matrixTransform(groups[0].getCTM());
    const mouth = new DOMPoint(407.5, 449).matrixTransform(groups[1].getCTM());
    return Math.round(Math.hypot(apex.x - mouth.x, apex.y - mouth.y) / px);
  });
  assert(anchorGap <= 2, `the light cone must start at the bulb opening, got ${anchorGap} units off`);
  // 光锥只许停在人物右侧之外：两边各自栅格化（连 defs 一起搬进游离 svg，否则渐变与滤镜引用失效）后求交
  const beamOnPerson = await page.evaluate(async () => {
    const W = 2198;
    const H = 1254;
    const raster = async node => {
      const clone = node.cloneNode(true);
      clone.querySelector('#background')?.remove();
      const href = URL.createObjectURL(new Blob(
        [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${clone.outerHTML}</svg>`],
        { type: 'image/svg+xml' },
      ));
      const img = await new Promise((ok, err) => {
        const el = new Image();
        el.onload = () => ok(el);
        el.onerror = err;
        el.src = href;
      });
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(href);
      return ctx.getImageData(0, 0, W, H).data;
    };
    const light = document.getElementById('brook-lamp').cloneNode(true);
    const keep = new Set([light.querySelector('defs'), light.querySelector(':scope > g')]);
    [...light.children].forEach(el => {
      if (!keep.has(el)) el.remove();
    });
    const person = await raster(document.querySelector('.brook-scene > svg > g'));
    const beam = await raster(light);
    let hits = 0;
    for (let i = 3; i < person.length; i += 4) if (person[i] > 8 && beam[i] > 8) hits += 1;
    return hits;
  });
  assert.equal(beamOnPerson, 0, 'the light pool must stop short of the skull');
  // 颅骨呼吸挂在 #skull 上，SVG 变换落在 transform 属性
  assert(
    await page.evaluate(() => /matrix/.test(document.querySelector('#skull').getAttribute('transform') ?? '')),
    'the skull breathes inside the hood',
  );
  // 眼窝交给 hero-eyes.riv 之后，画布交出第一帧才收起原稿那两片
  await page.waitForSelector('.brook-scene.eyes-live', { timeout: 25000 });
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.getElementById('left-eye-socket')).display),
    'none',
  );
  assert(await page.evaluate(() => document.querySelector('.brook-eyes').width > 100), 'the eyes canvas is sized');
  // 热气是 lottie 无限循环：两帧之间画面没推进就是没在播
  const steamFrame = () => page.evaluate(() => document.querySelector('.brook-steam svg')?.innerHTML ?? '');
  const steamBefore = await steamFrame();
  await page.waitForTimeout(400);
  assert.notEqual(await steamFrame(), steamBefore, 'the steam keeps looping');
  assert.deepEqual(
    await page.locator('main > section').evaluateAll(nodes => nodes.map(node => node.id)),
    ['home', 'about', 'works', 'contact'],
  );
  assert.equal(await page.locator('.topbar').count(), 0);
  // 三张贴纸落位才继续
  await page.waitForFunction(() => document.querySelectorAll('.sticker').length === 3, null, { timeout: 15000 });
  assert.deepEqual(await page.locator('.sticker-name').allTextContents(), stickerRepos);
  assert.deepEqual(
    await page.locator('.sticker-open').evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))),
    repos.map(repo => repo.html_url),
  );
  assert.equal(await page.locator('.sticker-tape').count(), 3, 'every sticker is taped at the top edge');
  // 贴纸正文统一英文：整块作品区不许出现汉字
  assert(!/[\u4e00-\u9fff]/.test(await page.locator('#works').innerText()), 'sticker copy stays English');
  assert.equal(await page.locator('.skill-group').count(), 0);
  assert.equal(await page.locator('.scroll-progress').count(), 1);
  checks.push('Hooded skull original renders; home sections; works stickers from the GitHub API');

  await page.screenshot({ path: '.shots/hero-desktop.png' });
  await checkOrb(page, 'home', '/');

  // 点击外部收起
  await page.locator('.orb-trigger').click();
  await page.waitForFunction(() => document.querySelector('.orb')?.dataset.open === 'true');
  await page.locator('.section-title').first().click();
  await page.waitForFunction(() => document.querySelector('.orb')?.dataset.open === 'false');
  checks.push('Orb collapses on outside click');

  // 贴纸墙：滚到揭示位落定；拖动已取消，横向位移不许再挪动贴纸
  const tiltOf = locator => locator.evaluate(el => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return Math.round(Math.atan2(m.b, m.a) * (180 / Math.PI) * 10) / 10;
  });
  await page.locator('#works').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1600);
  await page.locator('#works').screenshot({ path: '.shots/works-stickers.png' });
  const card = page.locator('.sticker').nth(1);
  const tilt = await tiltOf(card);
  assert.equal(tilt, 2.2, 'the middle sticker rests at its hand-placed angle');
  const body = await card.boundingBox();
  await page.mouse.move(body.x + body.width / 2, body.y + body.height / 2);
  await page.mouse.down();
  await page.mouse.move(body.x + body.width / 2 + 90, body.y + body.height / 2, { steps: 10 });
  await page.waitForTimeout(350);
  assert.equal(await tiltOf(card), tilt, 'dragging the sticker does nothing');
  await page.mouse.up();
  checks.push(`Sticker wall reveals on scroll at ${tilt}deg tilt; the sticker is drag-inert`);

  // 跳转只归右下角那颗圆钮：点贴纸本体不开新标签
  const popups = [];
  page.on('popup', popup => popups.push(popup));
  await page.locator('.sticker').nth(0).click();
  await page.waitForTimeout(500);
  assert.equal(popups.length, 0, 'the sticker body must not navigate anywhere');
  const [repoTab] = await Promise.all([
    page.waitForEvent('popup'),
    page.locator('.sticker-open').nth(0).click(),
  ]);
  await repoTab.waitForURL(/Fu3rte\/Fit-Agent/);
  assert.equal(popups.length, 1, 'the corner button opens the repo');
  await repoTab.close();
  checks.push('Sticker body ignores navigation; the corner button opens the repo in a new tab');

  // 联系区：巨型标题 + 一行渠道，图钉、卷线、二维码都不在
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  assert.equal(await page.locator('.contact-me').textContent(), 'Contact me');
  assert.deepEqual(
    await page.locator('.contact-rows li').evaluateAll(list => list.map(li => [
      li.querySelector('b').textContent,
      li.querySelector('a, span').textContent,
    ])),
    [
      ['Email', '2575716528cqh@gmail.com'],
      ['GitHub', 'Fu3rte'],
      ['Instagram', 'cq777h'],
      ['WeChat', 'F1nnian_'],
    ],
  );
  assert.equal(
    await page.locator('.contact-rows a').first().getAttribute('href'),
    'mailto:2575716528cqh@gmail.com',
  );
  assert.equal(
    await page.locator('.contact-pin, .contact-cord, .contact-stage, .contact-rows img, .contact-rows canvas, .qr').count(),
    0,
    'no pins, no cord, no QR',
  );
  assert(
    await page.evaluate(() => !performance.getEntriesByType('resource').some(r => r.name.includes('matter'))),
    'the physics engine is out of the load graph',
  );
  // matter 的 Mouse 会在宿主元素上 preventDefault 掉 wheel，滚轮扫过联系区必须照常翻页
  const atBottom = await page.evaluate(() => window.scrollY);
  const contactBox = await page.locator('#contact').boundingBox();
  await page.mouse.move(contactBox.x + contactBox.width / 2, contactBox.y + contactBox.height / 2);
  await page.mouse.wheel(0, -500);
  await page.waitForTimeout(700);
  assert(await page.evaluate(() => window.scrollY) < atBottom - 300, 'the wheel scrolls over the contact section');
  await page.locator('#contact').screenshot({ path: '.shots/contact-home.png' });
  checks.push('Contact section: oversized title, four channels, wheel still scrolls past it');

  // 冷缓存：按仓库名各发一发 GET，配额耗尽时也不会有第四发
  const coldWall = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
  const calls = [];
  coldWall.on('request', request => {
    if (request.url().includes('api.github.com')) calls.push(request.url());
  });
  await coldWall.goto(new URL('/', url).href, { waitUntil: 'networkidle' });
  await coldWall.waitForTimeout(1500);
  assert.deepEqual(calls, stickerRepos.map(name => `https://api.github.com/repos/Fu3rte/${name}`));
  checks.push(`Cold cache issues ${calls.length} GETs for the sticker wall`);
  await coldWall.close();

  // :focus-visible 只在真实键盘导航下成立；全新页面才有确定的 Tab 起点
  await page.close();
  const focused = await open({}, { repos });
  await focused.keyboard.press('Tab');
  assert.equal(await focused.evaluate(() => document.activeElement?.className), 'orb-trigger');
  assert.notEqual(await focused.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'none');
  await focused.keyboard.press('Tab');
  assert.match(await focused.evaluate(() => document.activeElement?.className ?? ''), /sticker/);
  assert.notEqual(await focused.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'none');
  // 折叠态的菜单项 visibility:hidden，不进入 Tab 序列；键盘 Enter 展开后才可达
  await focused.keyboard.press('Shift+Tab');
  await focused.keyboard.press('Enter');
  await settled(focused, true);
  await focused.keyboard.press('Tab');
  assert.match(await focused.evaluate(() => document.activeElement?.className ?? ''), /orb-item/);
  checks.push('Orb trigger then sticker links are keyboard-focusable with a visible focus ring');
  await focused.close();

  const photos = await open({}, {}, '/photos');
  assert.equal(await photos.locator('.section-title').textContent(), 'Photos');
  assert.equal(await photos.locator('.photos-grid img').count(), 10);
  const natural = await photos.locator('.photos-grid img').first().evaluate(el => el.naturalWidth);
  assert(natural > 100, 'photos must decode real image bytes');
  assert.equal(await photos.title(), 'Photos — Finnian');
  await checkOrb(photos, 'photos', '/photos');
  await photos.screenshot({ path: '.shots/photos-desktop.png', fullPage: true });
  await photos.close();

  const contact = await open({}, {}, '/contact');
  assert.equal(await contact.locator('.contact-title').textContent(), 'Contact');
  assert.equal(await contact.locator('.contact-big').getAttribute('href'), 'mailto:2575716528cqh@gmail.com');
  assert.equal(await contact.locator('.contact-list.row li').count(), 3);
  assert.equal(await contact.locator('.wordmark').getAttribute('href'), '/');
  assert.equal(await contact.title(), 'Contact — Finnian');
  await checkOrb(contact, 'contact', '/contact');
  await contact.screenshot({ path: '.shots/contact-desktop.png', fullPage: true });
  checks.push('Contact route stands alone: title, mail, three links, wordmark back');
  await contact.close();

  const chinese = await open({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }, { lang: 'zh', repos });
  assert.equal(await chinese.locator('html').getAttribute('lang'), 'zh-CN');
  assert.equal(await chinese.locator('.contact-me').textContent(), '联系我');
  assert.deepEqual(
    await chinese.locator('.contact-rows b').allTextContents(),
    ['邮箱', 'GitHub', 'Instagram', '微信'],
  );
  await chinese.locator('#contact').screenshot({ path: '.shots/contact-mobile-zh.png' });
  // 降低动效偏好下展开/收起直接落到终态
  await chinese.locator('.orb-trigger').click();
  await settled(chinese, true);
  const zhHeight = await size(chinese.locator('.orb'));
  assert(zhHeight > 150, `reduced motion jumps open, got ${zhHeight}`);
  assert.equal(await visible(chinese.locator('.orb-cell').first()), 'visible');
  await chinese.screenshot({ path: '.shots/orb-mobile-zh.png' });
  await chinese.close();

  const zhPhotos = await open(
    { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' },
    { lang: 'zh' },
    '/photos',
  );
  assert.equal(await zhPhotos.locator('.section-title').textContent(), '照片');
  assert.equal(await zhPhotos.locator('.orb-item').first().getAttribute('aria-label'), '首页');
  await zhPhotos.screenshot({ path: '.shots/photos-mobile-zh.png' });
  await zhPhotos.close();

  const zhContact = await open(
    { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' },
    { lang: 'zh' },
    '/contact',
  );
  assert.equal(await zhContact.locator('.contact-title').textContent(), '联系');
  await zhContact.screenshot({ path: '.shots/contact-mobile-zh.png', fullPage: true });
  await zhContact.close();
  checks.push('Chinese locale on all three routes; mobile + reduced motion jumps to the open state');

  assert.deepEqual(errors, [], `unexpected browser errors: ${JSON.stringify(errors)}`);
  checks.push('No browser page errors or same-origin resource failures');
} finally {
  await browser.close();
}

console.log(checks.join('\n'));
console.log(`\ncheck-hero: PASS (${checks.length} groups, ${errors.length} errors)`);
