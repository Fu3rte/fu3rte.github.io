import gsap from 'gsap';
import lottie, { type AnimationItem } from 'lottie-web/build/player/lottie_light';
import { currentTheme, subscribeTheme, type Theme } from './theme';

// 深色主题下压场的是另一份纸色反相的变体，两份素材除墨色外逐帧相同
const SOURCE: Record<Theme, string> = {
  light: '/lottie/brook-load.json',
  dark: '/lottie/brook-load.dark.json',
};
// brook-load.json 的组装段落在 0-66 帧：描边逐笔勾出五官、随后落成实心，66-222 帧是首尾同值的无缝循环
const INTRO_END = 66;
const LOOP_SEGMENT: [number, number] = [66, 222];

type Mode = 'long' | 'short';
type Stage = 'fonts' | 'content' | 'assets';
type Phase = 'waiting' | 'releasing' | 'released';

// 冷启动把整张标志从头画完再交场，路由切换在覆盖层压住的那一拍把标志重画一次。
// draw/hold 以毫秒计（组装段落的绘制时长与落成之后的驻留），wipe 按 gsap 的秒计。
const RHYTHM: Record<Mode, { draw: number; hold: number; wipe: number }> = {
  long: { draw: 1500, hold: 1150, wipe: 0.62 },
  short: { draw: 820, hold: 420, wipe: 0.52 },
};
// 幕布擦回满版的那一拍，只有路由切换用得到
const COVER_S = 0.42;
// gsap.delayedCall 以秒计，兜底常量按秒命名，避免与 performance.now 的毫秒混用
const LONG_HOLD_S = 6;
// 幕布的两端：这一站是满版压场，那一站是从左缘擦净。百分比单位必须写死，
// gsap 的字符串插值照抄终点单位，写成 inset(0 0 0 0) 会插出 inset(0 0 0 37) 这种非法值，
// 浏览器整条丢掉，幕布就不擦了、直接硬切
const CURTAIN = { open: 'inset(0% 0% 0% 0%)', shut: 'inset(0% 0% 0% 100%)' };
// 字体走第三方 CDN，链路不通时 fonts.ready 永远不 resolve，等满这一档就按已就位处理
const FONT_WAIT_MS = 1200;

// 权重取整数百分比，求和恰好 100，浮点相加会永远差一点到不了顶
const WEIGHTS: Record<Stage, number> = { fonts: 35, content: 35, assets: 30 };

let overlayEl: HTMLElement | null = null;
let markEl: HTMLElement | null = null;
let captionEl: HTMLElement | null = null;
let anim: AnimationItem | null = null;
let phase: Phase = 'waiting';
let looping = false;
let reduced = false;
let mode: Mode = 'long';
// 组装段落起笔与落成的时刻：驻留从落成那一拍起算，绘制时长不受请求快慢影响
let drawAt = 0;
let heldAt = 0;
let jsonReady = false;
let markSettled = false;
let target = 0;

const reached = new Set<Stage>();
const waiters = new Set<() => void>();

export function bootLoader(): void {
  const overlay = document.getElementById('brook-loader')!;
  const mark = document.getElementById('brook-mark')!;
  overlayEl = overlay;
  markEl = mark;
  captionEl = document.getElementById('brook-caption');
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    // 降低动效偏好下连动画素材都不必下载，覆盖层只等正文就位
    markSettled = true;
    heldAt = performance.now();
  } else {
    loadMark(mark, currentTheme());
    subscribeTheme(reloadMark);
  }
  watchContent();
  window.addEventListener('pageshow', onPageRestore);
  // 覆盖层压场期间滚动一律拒收：滚轮一推进页面，正文的 ScrollTrigger 锚点就在无人看见的那一拍被消耗光
  window.addEventListener('wheel', blockScroll, { passive: false });
  window.addEventListener('touchmove', blockScroll, { passive: false });

  void Promise.race([
    document.fonts.ready,
    new Promise<void>(resolve => {
      window.setTimeout(resolve, FONT_WAIT_MS);
    }),
  ]).then(() => markStage('fonts'));
  if (document.readyState === 'complete') markStage('assets');
  else window.addEventListener('load', () => markStage('assets'), { once: true });

  gsap.delayedCall(LONG_HOLD_S, forceRelease);
  gsap.ticker.add(tick);
}

function loadMark(mark: HTMLElement, theme: Theme): void {
  anim = lottie.loadAnimation({
    container: mark,
    renderer: 'svg',
    loop: true,
    autoplay: false,
    path: SOURCE[theme],
  });
  anim.addEventListener('data_ready', () => {
    jsonReady = true;
    markSettled = true;
    // 素材到位才开始起笔，两套节奏都走一遍组装段落
    drawAt = performance.now();
  });
  // 素材取不到也照常放行，loading 页不能把自己锁死
  anim.addEventListener('data_failed', () => {
    markSettled = true;
    heldAt = performance.now();
  });
}

// 主题开关落在覆盖层眼皮底下：换素材重放一次，节奏与状态一律不动
function reloadMark(theme: Theme): void {
  if (!markEl || reduced) return;
  const loopingWas = looping;
  looping = false;
  anim?.destroy();
  anim = null;
  jsonReady = false;
  loadMark(markEl, theme);
  if (loopingWas) startLoop();
}

// 正文挂载与页面用哪个组件无关，盯 #root 的第一个子节点即可
function watchContent(): void {
  const rootEl = document.getElementById('root')!;
  const settle = (): void => {
    requestAnimationFrame(() => markStage('content'));
  };
  if (rootEl.childElementCount) {
    settle();
    return;
  }
  const observer = new MutationObserver(() => {
    if (!rootEl.childElementCount) return;
    observer.disconnect();
    settle();
  });
  observer.observe(rootEl, { childList: true });
}

function markStage(stage: Stage): void {
  reached.add(stage);
  target = [...reached].reduce((sum, item) => sum + WEIGHTS[item], 0);
}

function blockScroll(event: Event): void {
  if (phase !== 'released') event.preventDefault();
}

function tick(): void {
  if (phase !== 'waiting') return;
  paintDraw();
  if (target >= 100 && markSettled && settled()) release();
}

// 逐笔组装跟着时钟走，网络快慢只决定它何时开始，不会被挤成一帧
function paintDraw(): void {
  if (looping || !drawAt || !jsonReady || !anim) return;
  const ratio = Math.min(1, (performance.now() - drawAt) / RHYTHM[mode].draw);
  anim.goToAndStop(ratio * INTRO_END, true);
  if (ratio >= 1) startLoop();
}

// 组装段落落成那一拍才起驻留计时，标志画到一半就被擦走的情况不再出现
function startLoop(): void {
  if (!anim || looping) return;
  looping = true;
  heldAt = performance.now();
  anim.loop = true;
  anim.playSegments(LOOP_SEGMENT, true);
}

function settled(): boolean {
  if (reduced) return true;
  return heldAt > 0 && performance.now() - heldAt >= RHYTHM[mode].hold;
}

function forceRelease(): void {
  if (phase !== 'waiting') return;
  // 超时放行也要把组装画完，否则徽标停在半张脸上
  startLoop();
  release();
}

function release(): void {
  if (phase !== 'waiting') return;
  phase = 'releasing';
  gsap.ticker.remove(tick);
  // 重载时浏览器把上次的 scrollY 还原在覆盖层底下，擦除起点先把页面按回顶端。
  // 站点开了 smooth 滚动，这里必须瞬时归位：擦除那几拍里页面还在慢慢往回爬，正文锚点就量不准了
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  // 正文动效与擦除同时起跑：覆盖层此刻仍满版压场，等收干净再起就是满版正文闪现后跳回 0
  announce();
  anim?.pause();
  if (reduced) {
    finish();
    return;
  }
  const overlay = overlayEl!;
  gsap.set(overlay, { clipPath: CURTAIN.open, willChange: 'clip-path' });
  gsap
    .timeline({ onComplete: finish })
    .to(captionEl, { autoAlpha: 0, y: 6, duration: 0.24, ease: 'power1.in' }, 0)
    .to(markEl, {
      autoAlpha: 0,
      scale: mode === 'long' ? 1.06 : 0.93,
      y: -14,
      duration: 0.36,
      ease: 'power2.in',
    }, 0.08)
    .to(overlay, { clipPath: CURTAIN.shut, duration: RHYTHM[mode].wipe, ease: 'power3.inOut' }, 0.14);
}

function finish(): void {
  phase = 'released';
  overlayEl!.classList.add('is-hidden');
  gsap.set([overlayEl, markEl, captionEl], { clearProps: 'all' });
}

function announce(): void {
  for (const waiter of waiters) waiter();
  waiters.clear();
}

// 正文动效的起跑线是覆盖层开始擦除的那一拍，压在满版遮挡后面空放等于白放
export function onLoaderDone(callback: () => void): () => void {
  if (phase !== 'waiting') {
    callback();
    return () => {};
  }
  waiters.add(callback);
  return () => {
    waiters.delete(callback);
  };
}

function onPageRestore(event: PageTransitionEvent): void {
  // bfcache 回来的正文已就位，覆盖层停在哪个状态都直接收走
  if (!event.persisted || phase !== 'waiting') return;
  gsap.ticker.remove(tick);
  announce();
  finish();
}

// 路由切换复用同一份骨架：盖满屏的那一拍换正文，驻留之后按短节奏擦除
export function withTransition(swap: () => void): void {
  if (reduced) {
    swap();
    return;
  }
  if (!overlayEl!.classList.contains('is-hidden')) {
    // 冷启动的覆盖层还压着，正文就地替换，放行仍由它自己的节奏决定
    swap();
    return;
  }
  mode = 'short';
  phase = 'waiting';
  // 素材与正文在上一轮就已就位，切换只剩节奏，就绪度直接给满
  target = 100;
  markSettled = true;
  gsap.ticker.add(tick);
  replayForDeparture(swap);
}

function replayForDeparture(onCovered: () => void): void {
  const overlay = overlayEl!;
  overlay.classList.remove('is-hidden');
  gsap.set([markEl, captionEl], { clearProps: 'all' });
  gsap.set(overlay, { clipPath: CURTAIN.shut, willChange: 'clip-path' });
  // 幕布拉回之前先把标志擦回空白画纸：翻页也重走一遍组装段落，徽标不再整张弹出来
  looping = false;
  drawAt = 0;
  heldAt = 0;
  if (anim && jsonReady) {
    // 循环段的 firstFrame 不是 0，回到组装段落得连裁切段一起换回去
    anim.playSegments([0, INTRO_END], true);
    anim.pause();
  }
  gsap.to(overlay, {
    clipPath: CURTAIN.open,
    duration: COVER_S,
    ease: 'power3.inOut',
    onComplete: () => {
      onCovered();
      if (anim && jsonReady) drawAt = performance.now();
      else heldAt = performance.now();
    },
  });
  gsap.fromTo(captionEl,
    { autoAlpha: 0, y: 8 },
    { autoAlpha: 1, y: 0, duration: 0.34, ease: 'power2.out', delay: COVER_S * 0.4 },
  );
}
