import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { t } from '../../shared/i18n';

const FRAME_MS = 1000 / 60;
const MIN_COPIES = 3;
const NARROW_VP = 768;
// 巡航速度按 60fps 的每帧位移给，k 再把高刷屏的帧间隔折算回去，两套刷新率下肉眼等速
const BASE_WIDE = 0.8;
const BASE_NARROW = 0.5;
const CREEP = 0.15;
const EASE = 0.06;
const DECAY = 0.94;

// dir 是滚动方向的符号，+1 让内容向左走
const TRACKS = [
  {
    key: 'motion',
    dir: 1,
    items: ['React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Vite', 'GSAP', 'Rive', 'Lottie', 'SVG', 'Canvas'],
  },
  {
    key: 'agent',
    dir: -1,
    items: ['Python', 'FastAPI', 'PostgreSQL', 'pgvector', 'SQLite', 'OpenAI', 'ReAct', 'RAG', 'MCP', 'uv'],
  },
];

type PointerType = 'pointerenter' | 'pointerleave' | 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel';

export default function StackMarquee() {
  const stage = useRef<HTMLElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const [copies, setCopies] = useState(MIN_COPIES);

  useEffect(() => {
    const host = band.current;
    const section = stage.current;
    if (!host || !section) return;

    const rails = [...host.querySelectorAll<HTMLElement>('.stack-row')].map((row, index) => {
      const track = row.querySelector<HTMLElement>('.stack-track')!;
      const group = row.querySelector<HTMLElement>('.stack-group')!;
      return {
        row, track, group,
        dir: TRACKS[index].dir,
        period: group.getBoundingClientRect().width,
        offset: 0,
        cruise: 0,
        momentum: 0,
        hover: false,
        dragging: false,
        pointerX: 0,
        pointerT: 0,
        flick: 0,
      };
    });

    let base = window.innerWidth < NARROW_VP ? BASE_NARROW : BASE_WIDE;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer = 0;

    // 圆环落在 section 上而非带子里：带子自带 translateX，fixed 会跟着它的变换找参照
    const halo = ring.current!;
    let overStage = false;

    // 拖出板块时指针捕获仍在跑，圆环跟着手走才算握着这条胶带
    const visible = () => overStage || rails.some(rail => rail.dragging);
    const showHalo = () => halo.classList.toggle('is-on', visible());

    // 落位写在 translate 上：scale 与它同属变换属性链，写在 transform 里会被按压缩一起缩走
    const moveHalo = (event: PointerEvent) => {
      if (visible()) halo.style.translate = `calc(${event.clientX}px - 50%) calc(${event.clientY}px - 50%)`;
    };

    // 位移只在 [-period, 0) 里循环，接缝处整组回卷，视觉上接得上
    const apply = (rail: (typeof rails)[number]) => {
      const wrapped = ((rail.offset % rail.period) + rail.period) % rail.period;
      rail.track.style.transform = `translate3d(${-wrapped}px, 0, 0)`;
    };

    const step = (_time: number, delta: number) => {
      if (document.hidden) return;
      const k = Math.min(delta / FRAME_MS, 4);
      for (const rail of rails) {
        if (rail.dragging) continue;
        const target = (rail.hover ? CREEP : base) * rail.dir;
        rail.cruise += (target - rail.cruise) * (1 - (1 - EASE) ** k);
        rail.momentum *= DECAY ** k;
        rail.offset += (rail.cruise + rail.momentum) * k;
        apply(rail);
      }
    };

    if (!reduced) gsap.ticker.add(step);
    else rails.forEach(apply);

    const offs: (() => void)[] = [];
    const on = (el: EventTarget, type: PointerType, fn: (event: PointerEvent) => void) => {
      const handler = (event: Event) => fn(event as PointerEvent);
      el.addEventListener(type, handler);
      offs.push(() => el.removeEventListener(type, handler));
    };

    on(section, 'pointerenter', event => {
      overStage = true;
      moveHalo(event);
      showHalo();
    });
    on(section, 'pointerleave', () => {
      overStage = false;
      showHalo();
    });
    on(section, 'pointerdown', () => halo.classList.add('is-pressed'));
    // 松手点落在板块外也要收势：指针捕获把 up 送回行元素，只有挂在窗口上才接得住所有终点
    for (const type of ['pointerup', 'pointercancel'] as const) on(window, type, () => halo.classList.remove('is-pressed'));
    on(window, 'pointermove', moveHalo);

    for (const rail of rails) {
      const el = rail.row;
      const down = (event: PointerEvent) => {
        rail.dragging = true;
        rail.pointerX = event.clientX;
        rail.pointerT = event.timeStamp;
        rail.flick = 0;
        rail.momentum = 0;
        el.setPointerCapture(event.pointerId);
        el.classList.add('is-grabbing');
        event.preventDefault();
      };
      const move = (event: PointerEvent) => {
        if (!rail.dragging) return;
        const dx = event.clientX - rail.pointerX;
        const dt = Math.max(event.timeStamp - rail.pointerT, 1);
        rail.pointerX = event.clientX;
        rail.pointerT = event.timeStamp;
        rail.offset -= dx;
        rail.flick = rail.flick * 0.7 + (-dx / (dt / FRAME_MS)) * 0.3;
        apply(rail);
      };
      const up = (event: PointerEvent) => {
        if (!rail.dragging) return;
        rail.dragging = false;
        if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
        el.classList.remove('is-grabbing');
        rail.momentum = rail.flick;
        showHalo();
      };

      on(el, 'pointerenter', () => { rail.hover = true; });
      on(el, 'pointerleave', () => { rail.hover = false; });
      on(el, 'pointerdown', down);
      on(el, 'pointermove', move);
      on(el, 'pointerup', up);
      on(el, 'pointercancel', up);
    }

    // 组宽与副本数一起重算：窄了就退回三组，超宽屏按各自组宽取最缺的那条补到铺满视口再多留一组
    const remeasure = () => {
      for (const rail of rails) rail.period = rail.group.getBoundingClientRect().width;
      base = window.innerWidth < NARROW_VP ? BASE_NARROW : BASE_WIDE;
      const needed = Math.max(MIN_COPIES, ...rails.map(rail => Math.ceil(window.innerWidth / rail.period) + 1));
      setCopies(prev => (prev === needed ? prev : needed));
    };
    const onResize = () => {
      clearTimeout(timer);
      timer = window.setTimeout(remeasure, 200);
    };

    let mounted = true;
    window.addEventListener('resize', onResize);
    remeasure();
    // 等宽字体到位前量到的组宽不作数
    document.fonts.ready.then(() => { if (mounted) remeasure(); });

    return () => {
      mounted = false;
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      if (!reduced) gsap.ticker.remove(step);
      for (const off of offs) off();
    };
  }, [copies]);

  return (
    <section id="stack" className="section stack" ref={stage}>
      <header className="stack-head">
        <h2 className="section-title">{t('stack.title')}</h2>
        <span className="stack-note" aria-hidden="true">{t('stack.drag')}</span>
      </header>
      <div className="stack-band" ref={band}>
        {TRACKS.map(track => (
          <div className="stack-row" key={track.key}>
            <div className="stack-track">
              {Array.from({ length: copies }, (_, copy) => (
                <div className="stack-group" key={copy} aria-hidden={copy > 0}>
                  {track.items.map(item => (
                    <span className="stack-chip" key={item}>{item}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <span className="stack-halo" ref={ring} aria-hidden="true">
        <svg viewBox="0 0 20 20">
          <path d="M2.5 10h15M6 6.5 2.5 10 6 13.5M14 6.5 17.5 10 14 13.5" />
        </svg>
      </span>
    </section>
  );
}
