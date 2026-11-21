# 全站重构方案定稿（Refactor Plan）

## 1. 参考定位与融合原则

- **Looseleaf 底座（纸面与文具秩序）**：提供程序化墨水引擎（`src/lib/ink/*`）、纸面材质与格线系统（`Paper`、`stocks.ts`）、文具附件（`Tape` 胶带、`Fastener` 回形针/图钉/长尾夹）、相纸（`Polaroid`）、螺旋装订抽屉（`Sheet`）、写字板（`Clipboard`）与手写抖动文字（`Handwritten` / `Underline` / `Arrow` / `Badge` / `Button`）。
- **Sketchbook UI 灵感（粗线条表现力）**：手绘折叠组件（`src/lib/ink/recipes/accordion-ink.ts` + `src/components/ui/accordion.tsx`），并在交互贴纸堆（`.stack-chip`）与悬浮导航胶囊中融入粗黑墨线描边与硬偏移投影（`sketch-card-shadow`）。

## 2. 视觉与色彩体系

- **纸面基底**：彻底去除暖黄/米白底色，采用纯白/冷白 A3 工程方格纸底（`#fcfdfd` + `24px` 细格线 / `120px` 主格线与交点圆点）；为了避免 5 层大面积 CSS 渐变重绘掉帧，`body` 方格背景重构为**单张 120×120 内联 SVG 平铺砖**，且移除全局 `text-rendering: optimizeLegibility`。所有网格线、横线本标线及装饰性手绘线条采用**浅薄荷绿**（`--ll-rule-blue: #88cfba`、`--ll-pad-rule: #a7dfd0`、`--ll-check-rule: #7bc8b3`、`--ll-green: #3ea889`）。
- **作品区纸面区分**：`Works`（我的作品）与 `ProjectPage` 头部改用**非方格纸质**（`parchment` 再生档案纸 + `works-folio-mat` 虚线边界素面底衬、`card` 纯白厚卡纸、`ProjectCover` 改用细点阵 / 横线本图案），外框 `edge="cut"` 避免超大容器上的 2,400+ 顶点 `clip-path` 全屏重绘。
- **阴影与墨水**：冷灰阴影基色 `--ll-shade: 30 41 59`，主墨水 `--ll-ink: #1d242c`，正文柔墨 `--ll-ink-soft: #36414d` / `--ll-ink-muted: #52606e`。
- **高对比手账配色**：
  - 便利贴 5 色：黄 `#fff18f`、绿 `#c8f0c0`、橙 `#ffd09b`、粉 `#ffc7d4`、蓝 `#bde2ff`。
  - 笔触强调色：橙色马克笔 `--ll-marker: #ee6c3b`、宝蓝钢笔字 `--ll-ink-you: #2558b8`、荧光黄高光 `--ll-hi: #fff05a`、红笔 `--ll-red: #c9372c`、薄荷绿笔 `--ll-green: #3ea889`。
- **交互手型、文本选择与滚动条**：
  - 在 `src/index.css` `@layer base` 与 `buttonVariants` 为所有可点击交互元素统一提供 `cursor: pointer`（拖拽物理贴纸与拍立得为 `cursor: grab` / `cursor: grabbing`，禁用态为 `cursor: not-allowed`）。
  - **全局关闭文本选中（`user-select: none`）**，仅在表单输入控件及标注 `select-text` / `data-selectable="true"` 的**关键可复制联系信息**（`ContactWall.tsx` 与 `ContactPage.tsx` 中的邮箱 `2575716528cqh@gmail.com`、微信号 `F1nnian_`、GitHub 账号 `Fu3rte` 与 Instagram 账号 `cq777h`）保留文本选择。
  - 全面隐藏浏览器原生滚动条（`html, body, * { scrollbar-width: none; -ms-overflow-style: none; }` 与 `::-webkit-scrollbar { display: none; }`），仅保留顶部单条自定义细线 `.scroll-progress`（`height: 3px`）。

## 3. 字体方案

- **英文字体**：保留自托管 `Kevin Sans`（`src/assets/fonts/KevinSans-Regular.woff2` / `KevinSans-Bold.woff2`）以及裁剪为 **仅 Latin 子集** 的 `@fontsource/ibm-plex-mono`（`latin-400.css` + `latin-500.css`，去除无用的西里尔/越南语及旧版 `.woff` 文件）。
- **中文手写字体子集化**：源字体 `src/assets/fonts/RuiMeiJiaHand.ttf`（10.06 MB）仅保留在源码目录，通过 `scripts/subset-cjk-font.mjs` 调用 `uvx --from "fonttools[woff]" pyftsubset` 扫描全站文案、项目笔记及 TSX 文本提取唯一汉字与标点，生成精简的 `src/assets/fonts/RuiMeiJiaHand-subset.woff2`（约 350–450 KB，体积下降 ~96%），在 `src/fonts.css` 中合并为一条 `@font-face`（`font-weight: 400 700`）。
- **移除阻塞外链**：移除 `index.html` 中的 Google Fonts `Noto Sans SC` 阻塞式 `<link>`，`--font-cjk-hand` 回退至本地系统字体（`"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", cursive`）。

## 4. 页面架构与模块定稿（全站统一）

### 全局顶栏与 Loader
- **双层零回流合成胶囊顶栏（`src/app/SiteHeader.tsx` + `src/app/MobileNavSheet.tsx`）**：
  - 去除 `backdrop-blur-md` 与 `width`/`height`/`padding`/`borderWidth`/`gap`/`fontSize` 等触发布局重排与 `Underline` `ResizeObserver` 风暴的 GSAP 属性动画。
  - 采用双层互斥合成架构：`dockedRef`（56px 停靠通栏）与 `capsuleRef`（居中的 38px 紧凑 Badge 胶囊，移动端 `MobileNavSheet` 通过 `React.lazy` 按需加载）；滚动越过 `48px` 时，GSAP 仅对 `transform`（`y`/`scale`/`scaleX`）与 `opacity` 做 GPU 合成切换，停靠/悬浮均顺滑无卡顿。
- **首屏/切页 Loader & Favicon（`public/lottie/brook-load.json`、`src/shared/loader.ts`、`public/favicon.svg`）**：
  - **修复滚动快路径**：封装 `lockScroll()` / `unlockScroll()`，仅在覆盖层压场阶段挂载 `{ passive: false }` 的 `wheel`/`touchmove` 监听，`finish()` 时彻底移除监听并暂停 `anim?.pause()`（修复永久阻断浏览器合成线程滚动及 bfcache 泄漏问题）。
  - `lottie-web/build/player/lottie_light` 改为动态 `import()` 按需加载，缩短冷启动/切页驻留时长并用 `500ms` 竞速替代对 `window.load` 慢资源的无限等待。
  - 标签页图标 `public/favicon.svg` 采用黄色折角便利贴 + 浅薄荷绿横线手绘 SVG；布鲁克 `cane` 权杖保持紫色。

### 首页（`src/features/home/HomePage.tsx`，共 6 段：Hero + 01–05）

| 序号 | 组件 | 文件路径 | 核心结构与交互 |
| :--- | :--- | :--- | :--- |
| Hero | `SketchHero` | `src/features/home/SketchHero.tsx` | 纯粹主题元素与文具组件拼贴：左侧仅保留主题标题、关键词标签与双 CTA 按钮；右侧为可点击切章的手绘日历印章卡 + 4 色纸质样本扇形色卡 + 色标纸条，彻底剥离自我介绍 |
| 01 | `AboutWorkbench` | `src/features/home/AboutWorkbench.tsx` | 个人自我介绍主战场：横线主简介活页 + 撕边近况清单 + 3 条习惯便利贴 + 猫 / 咖啡 / **街健（修复后的手绘单杠引体小人 `OffDoodle` SVG 图标）** 生活卡片 |
| 02 | `Works` | `src/features/home/Works.tsx` | **`MY PROJECT` / `我的作品`**：`edge="cut"` 档案衬垫承托 `Fit-Agent` 与 `calisthenics-log` 两张 `card` 厚纸项目卡 + Sketchbook 手绘 `Accordion`，支持下方贴纸联动筛选 |
| 03 | `InteractionLab` | `src/features/home/InteractionLab.tsx` | **已删除 `3D Paper Toybox`（`PaperShelf3D.tsx`）** 及相关 `three` 依赖，专注 **`StackBench`（弹性贴纸堆）**：技能贴纸以 `'Vite'` 替代 `'Three.js'`；`IntersectionObserver` 懒加载 `matter-js`；开启 `enableSleeping: true` 并在贴纸静止时自动停止 rAF 循环（彻底消除后台空转）；缓存贴纸尺寸零 RAF `offsetWidth` 读取；缓存拖拽边界矩形；`.is-simulating` 动态按需启用 `will-change: transform` |
| 04 | `PhotosPreview` | `src/features/home/PhotosPreview.tsx` | 不对称交互式拍立得展示台：拖拽过程改用 `dragDeltaXRef` 直接写入前卡 `style.transform`（零 60–120Hz React 全家桶重渲染）；仅顶卡挂载 `preserve-3d` 与背面笔记；6 张图片全部 `loading="lazy"`；760px 等比缩放 WebP |
| 05 | `ContactWall` | `src/features/home/ContactWall.tsx` | 桌面横线手写信笺，邮箱 / 微信号 / GitHub / Instagram 文本支持选中复制（`select-text` + `CopyValue`） |

### 子页面与路由懒加载
- `src/app/routes.tsx` 对 `PhotosPage`、`ContactPage`、`ProjectPage` 采用 `React.lazy()` + `Suspense` 拆包；`vite.config.ts` 配置 `manualChunks` 拆分 `vendor-react` / `vendor-gsap` / `vendor-radix` / `vendor-i18n`。
- 10 张照片资源 `src/features/photos/assets/photo-*.webp` 等比压缩至长边 `<= 760px`，内存解码占用与传输体积降低 ~80%。

## 5. 图形引擎与 SVG 合成性能优化（Rendering Pipeline）

- **关闭低阶描边大位图遮罩（`src/lib/ink/builder.ts`）**：`grain` 默认值由 `true` 改为 `this.tier === 'hi'`，消除首页 ~45 个 Ink SVG 的 `8192×8192` `<mask>` 离屏光栅化与 `mix-blend-mode` 开销。
- **精简 `<InkProvider>` defs（`src/app/App.tsx`、`src/components/ui/paper.tsx`）**：首页设置 `<InkProvider defs={false} textures={['relief', 'slip']}>`；`Paper` 检测到外层已有 `InkProvider` 时不再重复渲染 `<InkTiles>`。
- **去除高代价 GPU 滤镜与多层叠加**：移除 `Tape` 与 `Fastener` 上 ~30 处 CSS `filter: drop-shadow()`；移除 `stocks.ts` / `paper.tsx` 上规则线层的 `maskImage` 与 `ll-multiply`；`.ll-paper::before, .ll-face` 精简为单张纸纹叠加高光渐变；粗化 `edges.ts` 中 `torn`/`deckle` 采样步长（`7.5` / `9.0`）；`Handwritten` 使用 `React.useMemo` 缓存切词树；`HomePage` 兄弟区块使用 `React.memo` 隔离技能筛选状态更新。

## 6. 全站 GSAP `ScrollTrigger` 编排矩阵（`src/shared/motion.ts`）

在 `prefers-reduced-motion: no-preference` 条件下统一于 `gsap.context()` 中挂载，并在一次性入场结束后通过 `clearProps` 清理内联状态：
1. **顶部阅读进度条**：`.scroll-progress` 随整页纵向滚动 `scrub: 0.3` 驱动 `scaleX(0 -> 1)`。
2. **Hero 多层视差（`setupHeroParallax`）**：`force3D: true` 驱动 `hero-copy` 与 `hero-layer-1/2/3` 视差。
3. **区块标题序列（`setupSectionHeadings`）**：章节序号徽章、标题、段落、手绘分隔线错峰串联。
4. **纸张与便利贴交错落位（`setupPaperAndStickies`）**：`paper-drop`、`sticky-pop` 与 `sticky-group` 渐显弹出。
5. **作品档案垫与封面流程图渐显（`setupWorksMotion`）**：`folio-mat`、`work-card` 与 SVG 节点顺次点亮。
6. **物理沙盒入屏唤醒（`setupLabWake`）**：首次滚动进入 `stack`（贴纸堆）时派发 `lab-enter` 轻快抛跳开场。
7. **拍立得牌堆与索引卡视差（`setupPhotoMotion`）**：`photo-deck` 与桌面端 `photo-index-scrub`（`force3D: true`）。
8. **相册页瀑布流发牌（`ScrollTrigger.batch`）**：`/photos` 页面 `polaroid-tile` 批量错峰发牌入场。
9. **案例笔记章节入场与零回流目录 Scroll-Spy（`setupCaseStudyMotion`）**：预缓存各章节文档 Y 坐标并用 `lastActiveId` 去重，滚动帧内零 `getBoundingClientRect()`、零多余 DOM 写入。
10. **`ScrollTrigger.refresh()` 去重**：去除 `SiteHeader` 在 `resize` 与路由切换上的冗余刷新，且 `App.tsx` 仅在语言实际变更时派发 `langchange`。

## 7. 资源清理与验收标准（DoD）

- **彻底移除死代码与大体积残留资产**：卸载 `three`、`@types/three`、`@rive-app/canvas`；删除 `src/features/home/PaperShelf3D.tsx`、`public/rive/*`（2.05 MB）、未使用 Lottie JSON `public/lottie/{steam,window-stars,window-sun}.json`（413 KB）及对应脚本、`src/features/home/assets/*.svg`。
- **零引导性文本约束（`AGENTS.md`）**：严禁生成任何非业务必需的装饰或引导文案。
- **验收标准（DoD）**：
  1. `npm run build`（`tsc --noEmit && vite build`）零错误通过；构建总产出体积大幅瘦身（目标从 18.28 MB 降至 ~2–3 MB 级别）；
  2. `3D Paper Toybox` 已彻底移除，`BAR / Street workout` 显示手绘单杠引体小人图标；
  3. 全站默认不可选中文本（`user-select: none`），仅联系信息等关键可复制字段保持可选（`user-select: text`）；
  4. 桌面端（`1440×900`）与移动端（`390×844`）实测零报错、滚动跟手顺滑无卡顿、物理沙盒静止休眠。
- **协作分工**：主控负责设计文档（`docs/refactor-plan.md`）撰写与审查；4 名 `dev-worker` 并行分工开发；`docs` worker 维护 `docs/progress.md`；`verifier` 负责构建验证；`browser` 负责真实浏览器测试与截图取证。
