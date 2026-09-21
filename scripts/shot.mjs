import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const URL = process.env.SHOT_URL ?? 'http://localhost:5173/'
const OUT = 'D:/陈祺宏/portfolio/.shots'
mkdirSync(OUT, { recursive: true })

// 每个语言节点都必须翻出来：文本仍等于 key 即为缺译
const audit = () =>
  Array.from(document.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-aria]')).flatMap(
    (el) => {
      const out = []
      const textKey = el.getAttribute('data-i18n') || el.getAttribute('data-i18n-html')
      if (textKey) {
        const text = el.textContent.trim()
        if (!text || text === textKey) out.push({ key: textKey, got: text })
      }
      const ariaKey = el.getAttribute('data-i18n-aria')
      if (ariaKey) {
        const aria = el.getAttribute('aria-label') || ''
        if (!aria || aria === ariaKey) out.push({ key: ariaKey, got: aria })
      }
      return out
    },
  )

const run = async () => {
  const browser = await chromium.launch()
  // 显式 en-US：宿主机系统语言是 zh-CN，不设 locale 的话「默认态」会被探测成中文
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text())
  })

  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const problems = []

  // ---------- EN（无 localStorage 时的默认） ----------
  const enState = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    brand: document.querySelector('.topbar .mono').textContent.trim(),
    title: document.title,
    active: document.querySelector('.lang-btn.is-active')?.dataset.lang,
  }))
  if (enState.lang !== 'en' || enState.active !== 'en')
    problems.push(`EN 默认态异常: ${JSON.stringify(enState)}`)
  const enMissing = await page.evaluate(audit)
  if (enMissing.length) problems.push(`EN 缺译: ${JSON.stringify(enMissing)}`)
  await page.screenshot({ path: `${OUT}/01-hero-light.png` })

  await page.mouse.move(250, 250)
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/02-cat-look-left.png` })

  // the cat is always breathing/tapping, so it never passes Playwright's
  // stability check — force the click to land on the moving target
  await page.click('#cat', { force: true })
  await page.waitForTimeout(350)
  await page.screenshot({ path: `${OUT}/03-cat-meow.png` })

  // keyboard focus must not draw the UA rectangle around the cat
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab')
    const id = await page.evaluate(() => document.activeElement?.id ?? '')
    if (id === 'cat') break
  }
  await page.screenshot({ path: `${OUT}/03b-cat-focus.png` })

  await page.click('#lamp')
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/04-hero-dark.png` })

  await page.click('#lamp')
  await page.waitForTimeout(900)

  await page.click('.dock-btn[data-target="work"]')
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `${OUT}/05-work.png` })

  await page.click('.dock-btn[data-target="contact"]')
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `${OUT}/06-contact.png` })

  // mid-scroll: skills section (reveal timeline + tag pop)
  await page.click('.dock-btn[data-target="skills"]')
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `${OUT}/06b-skills-midscroll.png` })

  // mid-scroll: about section prose reveal
  await page.click('.dock-btn[data-target="about"]')
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `${OUT}/06c-about-midscroll.png` })

  await page.screenshot({ path: `${OUT}/07-full.png`, fullPage: true })

  // ---------- 切到 ZH：无刷新、文案与标题同步 ----------
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.click('.lang-btn[data-lang="zh"]')
  await page.waitForTimeout(1200)

  const zhState = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    brand: document.querySelector('.topbar .mono').textContent.trim(),
    title: document.title,
    h1: Array.from(document.querySelectorAll('.hero-type span')).map((s) => s.textContent),
    active: document.querySelector('.lang-btn.is-active')?.dataset.lang,
    stored: localStorage.getItem('lang'),
    catAria: document.querySelector('#cat').getAttribute('aria-label'),
    bodyFont: getComputedStyle(document.body).fontFamily,
  }))
  if (zhState.lang !== 'zh-CN') problems.push(`切换后 <html lang> 未更新: ${zhState.lang}`)
  if (zhState.active !== 'zh') problems.push(`切换按钮态未跟随: ${zhState.active}`)
  if (zhState.stored !== 'zh') problems.push(`localStorage 未写入: ${zhState.stored}`)
  if (!/陈祺宏/.test(zhState.brand)) problems.push(`顶栏未翻译: ${zhState.brand}`)
  if (!/应用/.test(zhState.title)) problems.push(`标题未翻译: ${zhState.title}`)
  if (!/开发工程师/.test(zhState.h1.join(''))) problems.push(`hero 未翻译: ${zhState.h1}`)
  if (!/喵|猫/.test(zhState.catAria)) problems.push(`aria 未翻译: ${zhState.catAria}`)
  if (!/Noto Sans SC/.test(zhState.bodyFont)) problems.push(`中文字体未生效: ${zhState.bodyFont}`)
  const zhMissing = await page.evaluate(audit)
  if (zhMissing.length) problems.push(`ZH 缺译: ${JSON.stringify(zhMissing)}`)

  await page.screenshot({ path: `${OUT}/10-hero-zh.png` })
  await page.click('#cat', { force: true })
  await page.waitForTimeout(350)
  await page.screenshot({ path: `${OUT}/10b-meow-zh.png` })
  await page.click('.dock-btn[data-target="about"]')
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `${OUT}/11-about-zh.png` })
  await page.click('.dock-btn[data-target="work"]')
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `${OUT}/12-work-zh.png` })
  await page.click('.dock-btn[data-target="skills"]')
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `${OUT}/13-skills-zh.png` })
  await page.click('.dock-btn[data-target="contact"]')
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `${OUT}/14-contact-zh.png` })
  await page.screenshot({ path: `${OUT}/15-full-zh.png`, fullPage: true })

  // ---------- 刷新后偏好保持 ----------
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const kept = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    active: document.querySelector('.lang-btn.is-active')?.dataset.lang,
  }))
  if (kept.lang !== 'zh-CN' || kept.active !== 'zh')
    problems.push(`刷新后偏好丢失: ${JSON.stringify(kept)}`)
  await page.screenshot({ path: `${OUT}/16-zh-reload.png` })

  // ---------- 清缓存 + 浏览器语言为 zh-CN：应自动中文 ----------
  await page.evaluate(() => localStorage.clear())
  const ctxZh = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
  })
  const pZh = await ctxZh.newPage()
  pZh.on('pageerror', (e) => errors.push('zh-ctx pageerror: ' + e.message))
  await pZh.goto(URL, { waitUntil: 'networkidle' })
  await pZh.waitForTimeout(1200)
  const detected = await pZh.evaluate(() => ({
    lang: document.documentElement.lang,
    brand: document.querySelector('.topbar .mono').textContent.trim(),
  }))
  if (detected.lang !== 'zh-CN' || !/陈祺宏/.test(detected.brand))
    problems.push(`navigator.language 探测失败: ${JSON.stringify(detected)}`)
  await pZh.screenshot({ path: `${OUT}/17-zh-detected.png` })
  await ctxZh.close()

  // ---------- mobile pass (390 x 844) ----------
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    locale: 'en-US',
  })
  mobile.on('pageerror', (e) => errors.push('mobile pageerror: ' + e.message))
  mobile.on('console', (m) => {
    if (m.type() === 'error') errors.push('mobile console: ' + m.text())
  })

  await mobile.goto(URL, { waitUntil: 'networkidle' })
  await mobile.waitForTimeout(1500)
  await mobile.screenshot({ path: `${OUT}/08-mobile-hero.png` })

  await mobile.tap('.dock-btn[data-target="work"]')
  await mobile.waitForTimeout(1400)
  await mobile.screenshot({ path: `${OUT}/08b-mobile-work.png` })

  await mobile.evaluate(() => window.scrollTo(0, 0))
  await mobile.waitForTimeout(400)
  await mobile.tap('#lamp')
  await mobile.waitForTimeout(900)
  await mobile.screenshot({ path: `${OUT}/08c-mobile-dark.png` })

  // 移动端中文顶栏：语言开关不能把顶栏挤爆
  await mobile.tap('.lang-btn[data-lang="zh"]')
  await mobile.waitForTimeout(900)
  await mobile.screenshot({ path: `${OUT}/09-mobile-hero-zh.png` })
  const overflow = await mobile.evaluate(() => {
    const bar = document.querySelector('.topbar')
    return { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, bar: bar.scrollWidth }
  })
  if (overflow.scroll > overflow.client)
    problems.push(`移动端横向溢出: ${JSON.stringify(overflow)}`)
  await mobile.tap('.dock-btn[data-target="work"]')
  await mobile.waitForTimeout(1400)
  await mobile.screenshot({ path: `${OUT}/09b-mobile-work-zh.png` })

  await mobile.close()
  await ctx.close()

  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console/page errors')
  console.log(problems.length ? 'FAILURES:\n' + problems.join('\n') : 'i18n checks passed')
  await browser.close()
  if (problems.length || errors.length) process.exit(1)
}

run()
