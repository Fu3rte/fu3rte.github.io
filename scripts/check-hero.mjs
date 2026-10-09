import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

mkdirSync('.shots', { recursive: true });
const url = process.env.SHOT_URL ?? 'http://127.0.0.1:5182/';
const origin = new URL(url).origin;
const errors = [];
const checks = [];
const browser = await chromium.launch();

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
  desk: document.querySelector('#brook-desk').getAttribute('d'),
  cup: document.querySelectorAll('#brook-props path').length,
});

const open = async (options = {}, initial = {}, path = '/') => {
  const page = attach(await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'en-US', ...options }));
  await page.addInitScript(init => {
    localStorage.setItem('lang', init.lang ?? 'en');
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
  await page.addInitScript(lng => {
    localStorage.setItem('lang', lng);
  }, lang);
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
  await still.waitForFunction(() => window.__loaderHids.length >= 1, null, { timeout: 8000 });
  const reducedHid = await still.evaluate(() => window.__loaderHids[0]);
  assert(reducedHid < 2000, `reduced motion releases without a dwell, hid at ${reducedHid}ms`);
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
  checks.push(`Loader: reduced motion hid at ${reducedHid}ms, route switch lands without the overlay`);
  await still.close();

  const page = await open();
  // 兜帽骷髅原稿整幅挂进 1700x1254 画框，桌面一条直线，左侧一杯咖啡
  const box = await page.locator('.brook-scene > svg').boundingBox();
  assert(box && box.width > 400 && box.height > 250, `hooded skull must render, got ${JSON.stringify(box)}`);
  assert.deepEqual(await page.evaluate(sceneParts), {
    viewBox: '0 0 1700 1254',
    groups: ['background', 'sweatshirt', 'sleeves', 'hood-crown', 'hood-interior', 'skull', 'hood-lapels', 'laptop'],
    paths: 118,
    desk: 'M50 1150H1370',
    cup: 3,
  }, 'the authored hooded skull ships intact');
  // 颅骨呼吸挂在 #skull 上，SVG 变换落在 transform 属性
  assert(
    await page.evaluate(() => /matrix/.test(document.querySelector('#skull').getAttribute('transform') ?? '')),
    'the skull breathes inside the hood',
  );
  // 热气是 lottie 无限循环：两帧之间画面没推进就是没在播
  const steamFrame = () => page.evaluate(() => document.querySelector('.brook-steam svg')?.innerHTML ?? '');
  const steamBefore = await steamFrame();
  await page.waitForTimeout(400);
  assert.notEqual(await steamFrame(), steamBefore, 'the steam keeps looping');
  assert.deepEqual(
    await page.locator('main > section').evaluateAll(nodes => nodes.map(node => node.id)),
    ['home', 'about', 'works', 'skills'],
  );
  assert.equal(await page.locator('.topbar').count(), 0);
  assert.equal(await page.locator('.work-card').count(), 4);
  assert.equal(await page.locator('.site-foot a').getAttribute('href'), '/contact');
  assert.equal(await page.locator('.scroll-progress').count(), 1);
  checks.push('Hooded skull original renders; home sections; topbar gone; footer points at the contact route');

  await page.screenshot({ path: '.shots/hero-desktop.png' });
  await checkOrb(page, 'home', '/');

  // 点击外部收起
  await page.locator('.orb-trigger').click();
  await page.waitForFunction(() => document.querySelector('.orb')?.dataset.open === 'true');
  await page.locator('.section-title').first().click();
  await page.waitForFunction(() => document.querySelector('.orb')?.dataset.open === 'false');
  checks.push('Orb collapses on outside click');

  // :focus-visible 只在真实键盘导航下成立；全新页面才有确定的 Tab 起点
  await page.close();
  const focused = await open();
  await focused.keyboard.press('Tab');
  assert.equal(await focused.evaluate(() => document.activeElement?.className), 'orb-trigger');
  assert.notEqual(await focused.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'none');
  await focused.keyboard.press('Tab');
  assert.match(await focused.evaluate(() => document.activeElement?.className ?? ''), /work-card/);
  assert.notEqual(await focused.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'none');
  // 折叠态的菜单项 visibility:hidden，不进入 Tab 序列；键盘 Enter 展开后才可达
  await focused.keyboard.press('Shift+Tab');
  await focused.keyboard.press('Enter');
  await settled(focused, true);
  await focused.keyboard.press('Tab');
  assert.match(await focused.evaluate(() => document.activeElement?.className ?? ''), /orb-item/);
  checks.push('Orb trigger then work cards are keyboard-focusable with a visible focus ring');
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

  const chinese = await open({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }, { lang: 'zh' });
  assert.equal(await chinese.locator('html').getAttribute('lang'), 'zh-CN');
  assert.equal(await chinese.locator('.site-foot a').textContent(), '联系');
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
