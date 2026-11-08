import { useEffect, useRef } from 'react';
import { t } from '../../shared/i18n';
import SectionHeading from './SectionHeading';
import { PROJECTS } from './projects';

const SKILLS = [
  'React', 'TypeScript', 'Python', 'FastAPI', 'pgvector', 'RAG', 'ReAct', 'VLM',
  'GSAP', 'Three.js', 'Matter.js', 'Rive', 'Lottie',
];

type Props = {
  activeSkill: string | null;
  onSelect: (skill: string | null) => void;
};

export default function StackBench({ activeSkill, onSelect }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const related = activeSkill ? PROJECTS.filter(project => project.tech.includes(activeSkill)) : [];

  useEffect(() => {
    const host = stage.current;
    if (!host || reduced) return;
    let disposed = false;
    let cleanup = () => {};

    void import('matter-js').then(Matter => {
      if (disposed) return;
      const { Engine, Bodies, Composite, Body } = Matter;
      const engine = Engine.create({ gravity: { x: 0, y: 0.65, scale: 0.001 } });
      const buttons = [...host.querySelectorAll<HTMLButtonElement>('.stack-chip')];
      let width = host.clientWidth;
      let height = host.clientHeight;
      const bodies = buttons.map((button, index) => Bodies.rectangle(
        width * (0.12 + (index % 5) * 0.19),
        42 + Math.floor(index / 5) * 62,
        button.offsetWidth,
        button.offsetHeight,
        { restitution: 0.72, friction: 0.08, frictionAir: 0.018, angle: (index % 3 - 1) * 0.08 },
      ));

      const makeWalls = () => [
        Bodies.rectangle(width / 2, height + 35, width + 100, 70, { isStatic: true }),
        Bodies.rectangle(-35, height / 2, 70, height * 2, { isStatic: true }),
        Bodies.rectangle(width + 35, height / 2, 70, height * 2, { isStatic: true }),
        Bodies.rectangle(width / 2, -70, width + 100, 70, { isStatic: true }),
      ];
      let walls = makeWalls();
      Composite.add(engine.world, [...bodies, ...walls]);
      host.classList.add('is-physics');

      let dragged: (typeof bodies)[number] | null = null;
      let pointerId = -1;
      let previous = { x: 0, y: 0 };
      let velocity = { x: 0, y: 0 };
      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return;
        const button = (event.target as Element).closest('.stack-chip');
        const index = buttons.indexOf(button as HTMLButtonElement);
        if (index < 0) return;
        dragged = bodies[index];
        pointerId = event.pointerId;
        previous = { x: event.clientX, y: event.clientY };
        velocity = { x: 0, y: 0 };
        Body.setStatic(dragged, true);
      };
      const onPointerMove = (event: PointerEvent) => {
        if (!dragged || event.pointerId !== pointerId) return;
        if (!host.hasPointerCapture(pointerId) && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) > 4) {
          host.setPointerCapture(pointerId);
        }
        const box = host.getBoundingClientRect();
        Body.setPosition(dragged, {
          x: Math.max(30, Math.min(width - 30, event.clientX - box.left)),
          y: Math.max(24, Math.min(height - 24, event.clientY - box.top)),
        });
        velocity = { x: event.clientX - previous.x, y: event.clientY - previous.y };
        previous = { x: event.clientX, y: event.clientY };
      };
      const onPointerUp = (event: PointerEvent) => {
        if (!dragged || event.pointerId !== pointerId) return;
        Body.setStatic(dragged, false);
        Body.setVelocity(dragged, { x: velocity.x * 0.35, y: velocity.y * 0.35 });
        if (host.hasPointerCapture(pointerId)) host.releasePointerCapture(pointerId);
        dragged = null;
        pointerId = -1;
      };
      host.addEventListener('pointerdown', onPointerDown);
      host.addEventListener('pointermove', onPointerMove);
      host.addEventListener('pointerup', onPointerUp);
      host.addEventListener('pointercancel', onPointerUp);

      let visible = true;
      let focused = false;
      let frame = 0;
      let last = performance.now();
      let accumulator = 0;
      const step = 1000 / 60;
      const render = (now: number) => {
        accumulator += Math.min(now - last, 50);
        last = now;
        while (accumulator >= step) {
          Engine.update(engine, step);
          accumulator -= step;
        }
        bodies.forEach((body, index) => {
          const button = buttons[index];
          button.style.transform = `translate3d(${body.position.x - button.offsetWidth / 2}px, ${body.position.y - button.offsetHeight / 2}px, 0) rotate(${body.angle}rad)`;
        });
        frame = requestAnimationFrame(render);
      };
      const updateLoop = () => {
        const running = visible && !focused && !document.hidden;
        if (running && !frame) {
          last = performance.now();
          frame = requestAnimationFrame(render);
        } else if (!running && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      };
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        updateLoop();
      });
      observer.observe(host);
      const onFocusIn = (event: FocusEvent) => {
        if (!(event.target as Element).matches(':focus-visible')) return;
        focused = true;
        updateLoop();
      };
      const onFocusOut = (event: FocusEvent) => {
        if (host.contains(event.relatedTarget as Node)) return;
        focused = false;
        updateLoop();
      };
      host.addEventListener('focusin', onFocusIn);
      host.addEventListener('focusout', onFocusOut);
      document.addEventListener('visibilitychange', updateLoop);

      const resizeObserver = new ResizeObserver(() => {
        width = host.clientWidth;
        height = host.clientHeight;
        Composite.remove(engine.world, walls);
        walls = makeWalls();
        Composite.add(engine.world, walls);
        bodies.forEach(body => Body.setPosition(body, {
          x: Math.max(40, Math.min(width - 40, body.position.x)),
          y: Math.max(30, Math.min(height - 40, body.position.y)),
        }));
      });
      resizeObserver.observe(host);
      updateLoop();

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        resizeObserver.disconnect();
        document.removeEventListener('visibilitychange', updateLoop);
        host.removeEventListener('pointerdown', onPointerDown);
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerup', onPointerUp);
        host.removeEventListener('pointercancel', onPointerUp);
        host.removeEventListener('focusin', onFocusIn);
        host.removeEventListener('focusout', onFocusOut);
        host.classList.remove('is-physics');
        buttons.forEach(button => { button.style.transform = ''; });
        Composite.clear(engine.world, false, true);
        Engine.clear(engine);
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [reduced]);

  return (
    <section id="stack" className="section stack-bench">
      <SectionHeading index="04" eyebrow="INSTRUMENTS" title={t('stack.title')} />
      <p className="section-intro reveal">{t('stack.intro')}</p>
      <div className="stack-stage reveal" ref={stage} data-motion={reduced ? 'static' : 'physics'}>
        {SKILLS.map(skill => (
          <button
            type="button"
            className="stack-chip"
            key={skill}
            aria-pressed={activeSkill === skill}
            onClick={() => onSelect(activeSkill === skill ? null : skill)}
          >
            <span aria-hidden="true" />{skill}
          </button>
        ))}
      </div>
      <p className="stack-selection mono" aria-live="polite">
        {activeSkill && <><span>{activeSkill}</span>{related.length > 0 ? related.map(project => project.name).join(' · ') : t('stack.noMatch')}</>}
      </p>
    </section>
  );
}
