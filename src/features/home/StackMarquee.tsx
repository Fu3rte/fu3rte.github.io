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
  const band = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(MIN_COPIES);

  useEffect(() => {
    const host = band.current;
    if (!host) return;

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
    let timer = 0;

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

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) gsap.ticker.add(step);
    else rails.forEach(apply);

    const offs: (() => void)[] = [];
    for (const rail of rails) {
      const el = rail.row;
      const on = (type: PointerType, fn: (event: PointerEvent) => void) => {
        el.addEventListener(type, fn);
        offs.push(() => el.removeEventListener(type, fn));
      };
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
      };

      on('pointerenter', () => { rail.hover = true; });
      on('pointerleave', () => { rail.hover = false; });
      on('pointerdown', down);
      on('pointermove', move);
      on('pointerup', up);
      on('pointercancel', up);
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
    <section id="stack" className="section stack">
      <h2 className="section-title">{t('stack.title')}</h2>
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
    </section>
  );
}
