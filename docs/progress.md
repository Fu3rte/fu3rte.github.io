# 开发进度与技术决策记录（Progress）

## 1. 开发进度

| 模块 | 覆盖范围 | 当前状态 | 备注 |
| :--- | :--- | :--- | :--- |
| 全局主题、指针与选中策略 | `src/index.css`、`src/shared/style.css`、`public/favicon.svg` | 已完成 | 单张 120×120 SVG 网格替代多层渐变；隐藏原生滚动条；全局 `user-select: none`，仅表单与联系信息（`select-text` / `data-selectable="true"`）可选 |
| 徽章胶囊导航与首页 6 板块 | `SiteHeader.tsx`、`MobileNavSheet.tsx`、`HomePage.tsx`、`AboutWorkbench.tsx` | 已完成 | `SiteHeader` 改无模糊双层合成胶囊 + `inert` 隔离并懒加载 `MobileNavSheet`；修复 `BAR` 单杠小人图标；4 个静态区块接入 `React.memo` |
| 全站动效与滚动解锁 | `src/shared/motion.ts`、`src/shared/loader.ts` | 已完成 | `loader.ts` 在 `finish()` 移除 `{ passive: false }` `wheel`/`touchmove` 监听；`motion.ts` 以缓存坐标实现零回流 `syncActiveTocFromScroll` |
| 贴纸物理盒与 3D 清理 | `InteractionLab.tsx`、`StackBench.tsx`、`zh.json`、`en.json` | 已完成 | 删除 `PaperShelf3D.tsx` 与 `three`/`@rive-app/canvas` 等死资产；`StackBench` 用 `'Vite'` 替换 `'Three.js'`，延迟加载并开启 `enableSleeping: true` |
| 拍立得、作品与 3 大子页面 | `Works.tsx`、`PhotosPreview.tsx`、`PhotosPage.tsx`、`ProjectPage.tsx`、`ContactPage.tsx` | 已完成 | 10 张拍照 WebP 缩至 `<= 760px`（`3.63 MB -> 782.2 KB`，`-78.5%`）；`PhotosPreview` 改 Ref 零重绘拖拽与仅顶卡 `preserve-3d`；路由级 `React.lazy` |
| Sketchbook 渲染与字体裁剪 | `src/lib/ink/*`、`scripts/subset-cjk-font.mjs`、`src/fonts.css` | 已完成 | 低阶默认关闭 `grain`、`App.tsx` 设 `defs={false}` 并去重阴影滤镜；`RuiMeiJiaHand-subset.woff2` 裁剪至 `316.8 KB`（`-97%`），去 Google Fonts |
| 构建瘦身与双端验收 | `vite.config.ts`、`npm run build`、双端实测 | 已通过 | `dist/` 由 `18.28 MB` 降至 `2.79 MB`（36 个文件）；`1440×900` / `390×844` 实测 0 报错、0 溢出，休眠/选中/图标/胶囊通过 |

## 2. 做过的关键决策

- **A3 浅薄荷绿底与单层 SVG 合成**：冷白底（`#fcfdfd`）+ 浅薄荷绿（`#88cfba` / `#3ea889` / `#7bc8b3`），以单张 120×120 内联 SVG 网格取代 5 层 CSS 渐变；全局隐藏原生滚动条仅留 `.scroll-progress`。
- **禁用文本选中 + 联系信息白名单**：`src/index.css` 全局设置 `user-select: none` 防止拖拽贴纸/拍立得误选文本，仅对表单与 `ContactWall.tsx`/`ContactPage.tsx` 关键联系字段（`select-text`、`data-selectable="true"`）保留可选与复制。
- **删除 `3D Paper Toybox` 与冗余依赖**：移除 `PaperShelf3D.tsx`、`three`/`@types/three`/`@rive-app/canvas` 及无用 Rive/Lottie/SVG 死资产，`InteractionLab.tsx` 聚焦 `StackBench`（以 `'Vite'` 替换 `'Three.js'`），同步清理 `lab.toy*` 词条。
- **双层合成胶囊顶栏 & `inert` 隔离**：`SiteHeader.tsx` 去掉 `backdrop-blur-md`，改用 `transform`/`autoAlpha` 切换 `docked`/`capsule` 双层并配合 `inert`，`MobileNavSheet` 懒加载。
- **资源极致瘦身与拆包**：`scripts/subset-cjk-font.mjs` 配合 `uvx fonttools[woff]` 将 `RuiMeiJiaHand.ttf`（`10.55 MB`）裁剪为 `316.8 KB` `.woff2`（`582/582` 已用汉字 100% 覆盖）；移除 Google Fonts；`ibm-plex-mono` 仅留 Latin；10 张 WebP 缩放（`-78.5%`）；路由级 `React.lazy` + `vite.config.ts` `manualChunks`。
- **零重绘与休眠帧优化**：`Ink` 引擎低阶关闭 `grain`、`App.tsx` 设 `defs={false}` 并去重重型滤镜/巨型 `deckle clip-path`；`StackBench` 缓存尺寸零 RAF 回流并启用 `enableSleeping: true` 静止停帧；`PhotosPreview` Ref 零重绘拖拽；`motion.ts` 零回流目录追踪。
- **普通人语气与零引导文案**：保留 `Fit-Agent` 与 `calisthenics-log`，修复 `AboutWorkbench.tsx` `BAR` 图标，遵守 `AGENTS.md` 不生成引导性/装饰性文案。

## 3. 采用的技术

| 技术栈 / 库 | 版本（`package.json`） | 实际对应文件与用途 |
| :--- | :--- | :--- |
| React + TypeScript + Tailwind CSS v4 | `react ^19.3.0`、`typescript ~5.6.3`、`tailwindcss ^4.3.5` | 全站组件、`HomePage.tsx` `React.memo`、`routes.tsx` 路由级 `React.lazy`、`src/index.css` |
| 字体裁剪与构建工具链 | `scripts/subset-cjk-font.mjs`、`vite.config.ts` | `uvx fonttools[woff]` 产出 `RuiMeiJiaHand-subset.woff2`（`316.8 KB`）、`uvx Pillow` 压缩 WebP、`manualChunks` 分包 |
| Looseleaf Ink Engine + Radix UI | `radix-ui ^1.8.1` | `src/lib/ink/*`、`src/components/ui/*`（`App.tsx` `defs={false}`、低阶关 `grain`、`accordion-ink.ts`、`Polaroid`） |
| Matter.js | `matter-js ^0.20.0` | `src/features/home/StackBench.tsx`（延迟加载、缓存尺寸零回流、`enableSleeping: true`、`Constraint` 弹簧拖拽） |
| GSAP + ScrollTrigger | `gsap ^3.12.5` | `SiteHeader.tsx`（双层 `transform`/`autoAlpha` 胶囊）、`PhotosPreview.tsx`、`PhotosPage.tsx`、`motion.ts`、`loader.ts` |
| Lottie & i18next | `lottie-web ^5.12.2`、`i18next ^26.4.2` | `src/shared/loader.ts`（动态 `lottie_light` 加载 `/lottie/brook-load.json`）、`src/shared/i18n.ts`、`zh.json`、`en.json` |

## 4. P1 级别问题清单

- **`P1-1 [已修复]`**：`TapeKind` 类型全量修正为 `src/lib/ink/paper/props.ts` 合法枚举（`"washi-*"` / `"clear"` / `"masking"`）。
- **`P1-2 [已关闭]`**：原 `PaperShelf3D.tsx` 及 `three` 依赖已从项目中整体移除，交互实验区收敛为轻量稳态 `StackBench`。
- **`P1-3 [已通过]`**：`npm run build` 通过；`dist/` 由 `18.28 MB` 降至 `2.79 MB`（36 个文件，含 `fit-agent` 与 `calisthenics-log` 静态路由索引，无 `three`/`rive` 残留）。
- **`P1-4 [已通过]`**：桌面端（`1440×900`）与移动端（`390×844`）全量浏览器 QA 通过，0 控制台/网络报错、0 横向溢出；实测确认 `StackBench` 自动休眠停帧、`BAR` 单杠图标、全局禁选 + 联系信息可选、无模糊胶囊顶栏均正常。
- **`P1-5 [已解决]`**：`瑞美加张清平硬笔行书.ttf` 已接入 `"Custom CJK Hand"` 并全站 CJK 生效。
- **`P1-6 [已解决]`**：通过 `scripts/subset-cjk-font.mjs` + `uvx fonttools[woff]` 将 `RuiMeiJiaHand.ttf`（`10.55 MB`）裁剪为 `RuiMeiJiaHand-subset.woff2`（`316.8 KB`，体积下降 `97%`，已用 582 个汉字 100% 覆盖）。
