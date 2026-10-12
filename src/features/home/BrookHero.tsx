import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import lottie from 'lottie-web/build/player/lottie_light';
import type { Rive } from '@rive-app/canvas';
import { t } from '../../shared/i18n';
import { onLoaderDone } from '../../shared/loader';
import { currentTheme, subscribeTheme, type Theme } from '../../shared/theme';
import Tooltip from '../../shared/Tooltip';
import ThemeToggle from '../../app/ThemeToggle';
import hoodedSkull from './assets/hooded-skull.svg?raw';
import deskLamp from './assets/desk-lamp.svg?raw';
import catWindow from './assets/cat-window.svg?raw';
import catWindowNight from './assets/cat-window-night.svg?raw';

// 只取 <svg> 内的图元，根标签上的 fill="none" 由承接的 <g> 补上，
// 否则原稿里未写 fill 的描边路径会被填成黑块
const art = hoodedSkull.replace(/^<svg[^>]*>|<\/svg>\s*$/g, '');
// 台灯画稿与骷髅画稿各自定义了一次 #paper，注入时给台灯的那份改名，图元路径照原稿不动
const lamp = deskLamp
  .replace(/^<svg[^>]*>|<\/svg>\s*$/g, '')
  .replace('id="paper"', 'id="lamp-paper"')
  .replace('url(#paper)', 'url(#lamp-paper)');
// 两张窗各自带一份 #paper，夜窗的 art-title/art-desc 与骷髅画稿同名，注入时逐张改名，图元路径照原稿不动
const dayWindow = catWindow
  .replace(/^<svg[^>]*>|<\/svg>\s*$/g, '')
  .replace('id="paper"', 'id="day-window-paper"')
  .replace('url(#paper)', 'url(#day-window-paper)');
const nightWindow = catWindowNight
  .replace(/^<svg[^>]*>|<\/svg>\s*$/g, '')
  .replace('id="paper"', 'id="night-window-paper"')
  .replace('id="art-title"', 'id="night-window-title"')
  .replace('id="art-desc"', 'id="night-window-desc"');
// 两张窗共用一份裁切：窗台两耳 93..1021、窗框顶 189、尾梢 1262，换主题时窗子不挪位
const WINDOW_VIEW = '88 176 940 1092';
// 降低动效偏好下停在这一帧：三缕各自摊出杯口新生、途中上行、顶部稀释三种状态
const STEAM_HOLD = 45;

type Tap = readonly [time: number, hand: number, weight: number];

// 打字总谱：[落键时刻(s), 手(-1 左 / 1 右), 力度]，一呼一吸打完一句
const CYCLE = 5.4;
const ATTACK = 0.05;
// 颅骨在兜帽开口里起伏：内衬与两片 lapel 都排在 #skull 之后，位移露不出接缝
const BREATHE = -3;
const BREATHE_S = 2.7;
// 眼窝画布是 HTML 图层，同一个数字在它眼里是 CSS px，换算成 yPercent 才与 SVG 用户单位同速
const EYES_BREATHE = (BREATHE / 1254) * 100;

const TAPS: Tap[] = [
  [0.12, -1, 0.8], [0.24, -1, 0.55], [0.37, 1, 0.7], [0.53, -1, 0.9],
  [0.64, 1, 0.5], [0.79, 1, 0.85], [0.91, -1, 0.6],
  [1.46, 1, 0.75], [1.58, -1, 0.55], [1.73, 1, 0.8], [1.85, -1, 0.5],
  [2.34, -1, 0.9], [2.47, 1, 0.6], [2.61, -1, 0.7], [2.72, 1, 0.8],
  [3.25, 1, 0.65], [3.38, -1, 0.85], [3.52, 1, 0.55], [3.63, -1, 0.7],
  [4.14, 1, 1],
  [4.7, -1, 0.75], [4.83, 1, 0.55], [4.97, -1, 0.85],
];

// 一次落键拆成「下压 + 回弹到下一次落键」两段：连打时一路微颤，句读处才收干净
// 首段是落键前的静拍，末段一律收在 CYCLE 并与首帧同值，循环点无缝
const sleeveFrames = (hand: number): gsap.TweenVars[] => {
  const frames: gsap.TweenVars[] = [{ y: 0, duration: TAPS[0][0], ease: 'none' }];
  TAPS.forEach(([t, h, w], i) => {
    const next = i + 1 < TAPS.length ? TAPS[i + 1][0] : CYCLE;
    frames.push({ y: h === hand ? 7 * w : 0, duration: ATTACK, ease: 'power2.out' });
    frames.push({ y: 0, duration: next - t - ATTACK, ease: 'power2.out' });
  });
  return frames;
};

const WASM = '/rive/rive.wasm';
const EYES = '/rive/hero-eyes.riv';
// blink 标志要盖过 hero-eyes.riv 里 12 帧的 Blink 时间线，否则状态机回到 Idle 会立刻再眨一次
const BLINK_HOLD = 0.3;
const BLINK_GAP: [number, number] = [2.4, 6.2];

export default function BrookHero() {
  const scene = useRef<HTMLDivElement>(null);
  const speaker = useRef<HTMLDivElement>(null);
  const steam = useRef<HTMLDivElement>(null);
  const rays = useRef<HTMLDivElement>(null);
  const stars = useRef<HTMLDivElement>(null);
  const eyes = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 深色主题下热气换用反相的变体，浅色与无脚本环境共用原始素材
    const steamPath = (theme: Theme) => `/lottie/steam${theme === 'dark' ? '.dark' : ''}.json`;
    const load = (theme: Theme) =>
      lottie.loadAnimation({
        container: steam.current!,
        renderer: 'svg',
        loop: true,
        autoplay: !reduced,
        path: steamPath(theme),
      });
    let anim = load(currentTheme());
    if (reduced) {
      // 素材到位之前的 seek 会被丢掉，静态帧只能等 data_ready 再落
      anim.addEventListener('data_ready', () => anim.goToAndStop(STEAM_HOLD, true));
    }
    const unsubscribe = subscribeTheme(theme => {
      anim.destroy();
      anim = load(theme);
      if (reduced) anim.addEventListener('data_ready', () => anim.goToAndStop(STEAM_HOLD, true));
    });
    return () => {
      unsubscribe();
      anim.destroy();
    };
  }, []);

  // 窗里的日光与星光由 lottie 承接：日间只挂光芒层，夜里只挂星星层，
  // 与热气同一套换法——主题切换时销毁重建，同一时刻全站只有该动的在动
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const layers = {
      light: { node: rays, path: '/lottie/window-sun.json' },
      dark: { node: stars, path: '/lottie/window-stars.json' },
    };
    let anim: ReturnType<typeof lottie.loadAnimation> | null = null;
    const load = (theme: Theme) => {
      anim?.destroy();
      const { node, path } = layers[theme];
      anim = lottie.loadAnimation({
        container: node.current!,
        renderer: 'svg',
        loop: true,
        autoplay: !reduced,
        path,
      });
      // 降动效下钉在首帧：光芒与画稿逐字重合，星星全部满亮
      if (reduced) anim.addEventListener('data_ready', () => anim?.goToAndStop(0, true));
    };
    load(currentTheme());
    const unsubscribe = subscribeTheme(load);
    return () => {
      unsubscribe();
      anim?.destroy();
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let loops: gsap.core.Tween[] = [];
    const cancel = onLoaderDone(() => {
      // 敲击只在两条前臂上：机身与颅骨都不参与，眼窝由画布承接，呼吸必须同时作用在两条图层上才不会脱节
      loops = [
        gsap.to('#skull', { y: BREATHE, duration: BREATHE_S, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
        gsap.to(eyes.current!, {
          yPercent: EYES_BREATHE,
          duration: BREATHE_S,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        }),
        gsap.to('#left-sleeve', { keyframes: sleeveFrames(-1), repeat: -1 }),
        gsap.to('#right-sleeve', { keyframes: sleeveFrames(1), repeat: -1 }),
      ];
    });

    return () => {
      cancel();
      loops.forEach(tween => tween.kill());
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let rive: Rive | null = null;
    let timer: gsap.core.Tween | null = null;
    let blink: gsap.core.Timeline | null = null;
    let observer: ResizeObserver | null = null;
    let dropped = false;

    const cancel = onLoaderDone(() => {
      void import('@rive-app/canvas').then(({ Rive: Runtime, RuntimeLoader }) => {
        // 运行时默认从公共 CDN 取 wasm，站点自带一份才谈得上离线可跑
        RuntimeLoader.setWasmUrl(WASM);
        RuntimeLoader.setWasmFallbackUrl(null);
        if (dropped) return;
        const canvas = eyes.current!;
        const resize = (): void => {
          // 入场那一下父级带 scale，按 rect 取尺寸会把位图冻在缩放中间值，这里只认布局尺寸
          const dpr = window.devicePixelRatio || 1;
          canvas.width = Math.round(canvas.clientWidth * dpr);
          canvas.height = Math.round(canvas.clientHeight * dpr);
          rive?.resizeToCanvas();
        };
        const schedule = (): void => {
          timer = gsap.delayedCall(gsap.utils.random(BLINK_GAP[0], BLINK_GAP[1]), () => {
            blink?.restart();
            schedule();
          });
        };
        rive = new Runtime({
          canvas,
          src: EYES,
          stateMachine: 'Blink',
          autoplay: true,
          enableRiveAssetCDN: false,
          onLoad: () => {
            resize();
            // 画布交出第一帧之后才收起原稿的眼窝，交接过程不出现空窗
            rive?.drawFrame();
            scene.current?.classList.add('eyes-live');
            rive?.bindViewModelInstance(rive?.viewModelByName('Eyes')?.defaultInstance() ?? null);
            const input = rive?.viewModelInstance?.boolean('blink');
            if (!input) throw new Error(`${EYES} 里没有 blink 属性`);
            blink = gsap
              .timeline({ paused: true })
              .set(input, { value: true })
              .to({}, { duration: BLINK_HOLD })
              .set(input, { value: false });
            schedule();
          },
        });
        observer = new ResizeObserver(resize);
        observer.observe(canvas);
      });
    });

    return () => {
      dropped = true;
      cancel();
      observer?.disconnect();
      timer?.kill();
      blink?.kill();
      rive?.stop();
      rive?.cleanup();
    };
  }, []);

  return (
    <section id="home" className="hero brook-hero" aria-label={t('hero.aria')}>
      <div className="brook-scene" ref={scene}>
        <svg viewBox="0 0 2198 1254" aria-hidden="true">
          {/* 画稿 1254 见方，人物图元的包围盒中心正落在画框中线 x=1099 上；左侧留咖啡、右侧留台灯 */}
          <g
            transform="translate(472 0)"
            fill="none"
            dangerouslySetInnerHTML={{ __html: art }}
          />
          <g id="brook-props" transform="translate(174 0)" fill="none" stroke="#141414" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            <path id="brook-cup" d="M110 1000V1074C110 1121 145 1150 200 1150C255 1150 290 1121 290 1074V997" fill="#ffffff" />
            <path d="M128 983H268C281 983 290 989 290 997" />
            <path d="M290 1018C327 1021 356 1040 356 1061C356 1086 332 1102 290 1102" />
          </g>
          {/* 台灯：底座底缘坐在 y=1150 的桌面线上，灯罩与光束已在素材里绕灯头铰链抬起 30 度，灯口对着笔记本背面 */}
          <g
            id="brook-lamp"
            transform="translate(1552 464.8) scale(0.6)"
            dangerouslySetInnerHTML={{ __html: lamp }}
          />
          <path id="brook-desk" d="M50 1150H2150" stroke="#141414" strokeWidth="9" strokeLinecap="round" fill="none" />
        </svg>
        <canvas className="brook-eyes" ref={eyes} aria-hidden="true" />
        <div className="brook-steam" ref={steam} aria-hidden="true" />
        {/* 说话位：三处悬停共用头顶这一处落位，气泡始终由人物开口 */}
        <div className="brook-speaker" ref={speaker} aria-hidden="true" />
        {/* 悬停区罩在杯口以下，热气层落在杯口上缘，两层不重叠 */}
        <Tooltip label={t('tooltip.coffee')} anchor={speaker} fit={false}>
          <div className="brook-coffee" aria-hidden="true" />
        </Tooltip>
        {/* 左墙上的窗：日间是蓝天太阳与黑猫，夜里换成同一扇窗的月夜版 */}
        <Tooltip label={t('tooltip.window')} anchor={speaker} fit={false}>
          <div className="brook-window" aria-hidden="true">
            <svg className="brook-window-day" viewBox={WINDOW_VIEW} dangerouslySetInnerHTML={{ __html: dayWindow }} />
            <svg className="brook-window-night" viewBox={WINDOW_VIEW} dangerouslySetInnerHTML={{ __html: nightWindow }} />
            <div className="brook-window-lottie brook-window-rays" ref={rays} />
            <div className="brook-window-lottie brook-window-stars" ref={stars} />
          </div>
        </Tooltip>
        <Tooltip label={t('tooltip.theme')} anchor={speaker} fit={false}>
          <ThemeToggle className="hero-theme" />
        </Tooltip>
      </div>
    </section>
  );
}
