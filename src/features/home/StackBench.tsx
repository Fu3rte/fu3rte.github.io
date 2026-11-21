import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Paper } from '@/components/ui/paper';
import { useReducedMotion } from '@/hooks/use-live-motion';
import { t, useLanguage } from '../../shared/i18n';
import SectionHeading from './SectionHeading';
import { PROJECTS } from './projects';

const SKILLS = [
  'Python',
  'FastAPI',
  'ReAct',
  'SQLite',
  'React',
  'TypeScript',
  'JSON',
  'Vite',
  'Matter.js',
  'GSAP',
  'Lottie',
  'Tailwind',
] as const;

const STICKER_COLORS = [
  '#fff18f',
  '#bde2ff',
  '#c8f0c0',
  '#ffc7d4',
  '#ffd09b',
  '#ffffff',
] as const;

const CHIP_RADII = [
  '14px 6px 11px 7px / 7px 13px 6px 11px',
  '8px 14px 6px 12px / 11px 6px 13px 7px',
  '12px 7px 14px 5px / 6px 11px 8px 13px',
  '6px 12px 9px 14px / 12px 8px 14px 6px',
  '15px 5px 12px 8px / 8px 14px 5px 10px',
  '10px 13px 7px 11px / 13px 7px 12px 8px',
] as const;

type Props = {
  activeSkill: string | null;
  onSelect: (skill: string | null) => void;
};

type BenchActions = {
  scatter: () => void;
  setFloating: (next: boolean) => void;
  bounceChip: (index: number) => void;
  hopAll?: () => void;
};

export default function StackBench({ activeSkill, onSelect }: Props) {
  useLanguage();
  const [floating, setFloating] = useState(false);

  const paperRef = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const rubberLineRef = useRef<SVGLineElement>(null);
  const rubberDotStartRef = useRef<SVGCircleElement>(null);
  const rubberDotEndRef = useRef<SVGCircleElement>(null);
  const movedRef = useRef(0);
  const floatingRef = useRef(false);
  const actionsRef = useRef<BenchActions | null>(null);
  const ensureInitRef = useRef<(() => void) | null>(null);
  const pendingHopRef = useRef(false);
  const hasHoppedRef = useRef(false);

  const reduced = useReducedMotion(stage);
  const related = activeSkill ? PROJECTS.filter((project) => project.tech.includes(activeSkill)) : [];

  useEffect(() => {
    floatingRef.current = floating;
    actionsRef.current?.setFloating(floating);
  }, [floating]);

  useEffect(() => {
    const paper = paperRef.current;
    if (!paper || reduced) return;
    const onEnter = () => {
      if (hasHoppedRef.current) return;
      if (actionsRef.current) {
        hasHoppedRef.current = true;
        actionsRef.current.hopAll?.();
      } else {
        pendingHopRef.current = true;
        ensureInitRef.current?.();
      }
    };
    paper.addEventListener('lab-enter', onEnter, { once: true });
    return () => {
      paper.removeEventListener('lab-enter', onEnter);
    };
  }, [reduced]);

  useEffect(() => {
    const host = stage.current;
    if (!host || reduced) return;
    let disposed = false;
    let started = false;
    let cleanup = () => {};

    const startInit = () => {
      if (started || disposed) return;
      started = true;

      void import('matter-js').then((Matter) => {
        if (disposed) return;
        const { Engine, Bodies, Composite, Body, Constraint, Sleeping, Vector } = Matter;
        const engine = Engine.create({
          enableSleeping: true,
          gravity: { x: 0, y: 0.78, scale: 0.001 },
        });
        const buttons = [...host.querySelectorAll<HTMLButtonElement>('.stack-chip')];
        let width = host.clientWidth;
        let height = host.clientHeight;
        let halfSizes: Array<[number, number]> = buttons.map((button) => [
          button.offsetWidth / 2,
          button.offsetHeight / 2,
        ]);

        const bodies = buttons.map((_, index) => {
          const [hw, hh] = halfSizes[index]!;
          const bw = Math.max(48, hw * 2);
          const bh = Math.max(36, hh * 2);
          const minX = bw / 2 + 16;
          const maxX = Math.max(minX + 10, width - bw / 2 - 16);
          const minY = bh / 2 + 16;
          const maxY = Math.max(minY + 10, height * 0.56);
          const body = Bodies.rectangle(
            minX + Math.random() * (maxX - minX),
            minY + Math.random() * (maxY - minY),
            bw,
            bh,
            {
              restitution: 0.88,
              friction: 0.04,
              frictionAir: 0.008,
              chamfer: { radius: 8 },
              angle: (Math.random() - 0.5) * 0.96,
            },
          );
          Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 4.5,
            y: (Math.random() - 0.5) * 3.0,
          });
          Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.14);
          return body;
        });

        const makeWalls = () => [
          Bodies.rectangle(width / 2, height + 35, width + 200, 70, {
            isStatic: true,
            restitution: 0.92,
          }),
          Bodies.rectangle(-35, height / 2, 70, height + 200, {
            isStatic: true,
            restitution: 0.92,
          }),
          Bodies.rectangle(width + 35, height / 2, 70, height + 200, {
            isStatic: true,
            restitution: 0.92,
          }),
          Bodies.rectangle(width / 2, -35, width + 200, 70, {
            isStatic: true,
            restitution: 0.92,
          }),
        ];
        let walls = makeWalls();
        Composite.add(engine.world, [...bodies, ...walls]);
        host.classList.add('is-physics');
        host.style.cursor = 'pointer';

        const hideRubberBand = () => {
          if (rubberLineRef.current) rubberLineRef.current.style.visibility = 'hidden';
          if (rubberDotStartRef.current) rubberDotStartRef.current.style.visibility = 'hidden';
          if (rubberDotEndRef.current) rubberDotEndRef.current.style.visibility = 'hidden';
        };
        hideRubberBand();

        const updateRubberBand = (x1: number, y1: number, x2: number, y2: number) => {
          const line = rubberLineRef.current;
          const startDot = rubberDotStartRef.current;
          const endDot = rubberDotEndRef.current;
          if (line) {
            line.style.visibility = 'visible';
            line.setAttribute('x1', String(x1));
            line.setAttribute('y1', String(y1));
            line.setAttribute('x2', String(x2));
            line.setAttribute('y2', String(y2));
          }
          if (startDot) {
            startDot.style.visibility = 'visible';
            startDot.setAttribute('cx', String(x1));
            startDot.setAttribute('cy', String(y1));
          }
          if (endDot) {
            endDot.style.visibility = 'visible';
            endDot.setAttribute('cx', String(x2));
            endDot.setAttribute('cy', String(y2));
          }
        };

        let dragged: (typeof bodies)[number] | null = null;
        let draggedButton: HTMLButtonElement | null = null;
        let dragConstraint: Matter.Constraint | null = null;
        let emptyPress = false;
        let pointerId = -1;
        let previous = { x: 0, y: 0 };
        let cachedRect: DOMRect | null = null;

        let visible = false;
        let focused = false;
        let frame = 0;
        let last = performance.now();
        let accumulator = 0;
        const step = 1000 / 60;

        const render = (now: number) => {
          if (!floatingRef.current && !dragged && bodies.every((b) => b.isSleeping)) {
            frame = 0;
            host.classList.remove('is-simulating');
            return;
          }

          accumulator += Math.min(now - last, 50);
          last = now;
          while (accumulator >= step) {
            if (floatingRef.current) {
              bodies.forEach((body, idx) => {
                Sleeping.set(body, false);
                const speed = Math.hypot(body.velocity.x, body.velocity.y);
                if (speed < 1.35) {
                  Body.setVelocity(body, {
                    x: body.velocity.x + Math.cos(now * 0.002 + idx * 1.9) * 0.45,
                    y: body.velocity.y + Math.sin(now * 0.0023 + idx * 1.4) * 0.45,
                  });
                }
              });
            }
            Engine.update(engine, step);
            accumulator -= step;
          }

          bodies.forEach((body, index) => {
            const button = buttons[index]!;
            const [hw, hh] = halfSizes[index]!;
            button.style.transform = `translate3d(${body.position.x - hw}px, ${body.position.y - hh}px, 0) rotate(${body.angle}rad)`;
          });

          if (dragged && dragConstraint) {
            const worldAttach = Vector.rotate(dragConstraint.pointB, dragged.angle);
            updateRubberBand(
              dragged.position.x + worldAttach.x,
              dragged.position.y + worldAttach.y,
              dragConstraint.pointA.x,
              dragConstraint.pointA.y,
            );
          }

          if (!floatingRef.current && !dragged && bodies.every((b) => b.isSleeping)) {
            frame = 0;
            host.classList.remove('is-simulating');
            return;
          }

          frame = requestAnimationFrame(render);
        };

        const updateLoop = () => {
          const allAsleep = !floatingRef.current && !dragged && bodies.every((b) => b.isSleeping);
          const running = visible && !focused && !document.hidden && !allAsleep;
          if (running && !frame) {
            last = performance.now();
            host.classList.add('is-simulating');
            frame = requestAnimationFrame(render);
          } else if (!running && frame) {
            cancelAnimationFrame(frame);
            frame = 0;
            host.classList.remove('is-simulating');
          }
        };

        const wakeAll = () => {
          bodies.forEach((b) => Sleeping.set(b, false));
          updateLoop();
        };

        actionsRef.current = {
          scatter: () => {
            bodies.forEach((body) => {
              Body.setVelocity(body, {
                x: (Math.random() - 0.5) * 22,
                y: -(7.5 + Math.random() * 10.5),
              });
              Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.45);
            });
            wakeAll();
          },
          setFloating: (nextFloating: boolean) => {
            engine.gravity.y = nextFloating ? 0 : 0.78;
            if (nextFloating) {
              bodies.forEach((body) => {
                Body.setVelocity(body, {
                  x: body.velocity.x + (Math.random() - 0.5) * 6,
                  y: body.velocity.y - (2.2 + Math.random() * 4),
                });
                Body.setAngularVelocity(body, body.angularVelocity + (Math.random() - 0.5) * 0.14);
              });
            }
            wakeAll();
          },
          bounceChip: (index: number) => {
            const body = bodies[index];
            if (!body) return;
            Body.setVelocity(body, {
              x: body.velocity.x + (Math.random() - 0.5) * 3.5,
              y: -9.5,
            });
            Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.22);
            wakeAll();
          },
          hopAll: () => {
            bodies.forEach((body) => {
              Body.setVelocity(body, {
                x: (Math.random() - 0.5) * 3.5,
                y: -(4 + Math.random() * 3),
              });
              Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.16);
            });
            wakeAll();
          },
        };

        if (floatingRef.current) {
          actionsRef.current.setFloating(true);
        }
        if (pendingHopRef.current && !hasHoppedRef.current) {
          pendingHopRef.current = false;
          hasHoppedRef.current = true;
          actionsRef.current.hopAll?.();
        }

        const invalidateRect = () => {
          cachedRect = null;
        };

        const clampStagePt = (clientX: number, clientY: number) => {
          const box = cachedRect ?? (cachedRect = host.getBoundingClientRect());
          return {
            x: Math.max(8, Math.min(width - 8, clientX - box.left)),
            y: Math.max(8, Math.min(height - 8, clientY - box.top)),
          };
        };

        const onPointerDown = (event: PointerEvent) => {
          if (event.button !== 0) return;
          pointerId = event.pointerId;
          previous = { x: event.clientX, y: event.clientY };
          movedRef.current = 0;
          cachedRect = host.getBoundingClientRect();

          const button = (event.target as Element).closest('.stack-chip') as HTMLButtonElement | null;
          const index = button ? buttons.indexOf(button) : -1;

          if (index >= 0 && button) {
            dragged = bodies[index]!;
            draggedButton = button;
            emptyPress = false;
            const localPt = clampStagePt(event.clientX, event.clientY);
            const worldOffset = {
              x: localPt.x - dragged.position.x,
              y: localPt.y - dragged.position.y,
            };
            const localOffset = Vector.rotate(worldOffset, -dragged.angle);
            dragConstraint = Constraint.create({
              pointA: localPt,
              bodyB: dragged,
              pointB: localOffset,
              stiffness: 0.16,
              damping: 0.06,
              length: 0,
            });
            Composite.add(engine.world, dragConstraint);
            button.classList.add('is-dragging');
            button.style.cursor = 'grabbing';
            host.style.cursor = 'grabbing';
            host.style.touchAction = 'none';
            wakeAll();
          } else {
            dragged = null;
            draggedButton = null;
            emptyPress = true;
          }
        };

        const onPointerMove = (event: PointerEvent) => {
          if (event.pointerId !== pointerId) return;
          const dx = event.clientX - previous.x;
          const dy = event.clientY - previous.y;
          movedRef.current += Math.hypot(dx, dy);
          previous = { x: event.clientX, y: event.clientY };

          if (dragged && dragConstraint) {
            if (!host.hasPointerCapture(pointerId) && movedRef.current > 4) {
              host.setPointerCapture(pointerId);
            }
            const localPt = clampStagePt(event.clientX, event.clientY);
            dragConstraint.pointA.x = localPt.x;
            dragConstraint.pointA.y = localPt.y;
          }
        };

        const onPointerUp = (event: PointerEvent) => {
          if (event.pointerId !== pointerId) return;
          if (host.hasPointerCapture(pointerId)) {
            host.releasePointerCapture(pointerId);
          }

          if (dragConstraint) {
            Composite.remove(engine.world, dragConstraint);
            dragConstraint = null;
          }
          if (draggedButton) {
            draggedButton.classList.remove('is-dragging');
            draggedButton.style.cursor = '';
            draggedButton = null;
          }
          hideRubberBand();
          host.style.cursor = 'pointer';
          host.style.touchAction = '';

          if (emptyPress && movedRef.current <= 8) {
            const hit = clampStagePt(event.clientX, event.clientY);
            bodies.forEach((body) => {
              const dx = body.position.x - hit.x;
              const dy = body.position.y - hit.y;
              const dist = Math.max(24, Math.hypot(dx, dy));
              const falloff = Math.max(0.22, 1 - dist / Math.max(width, 420));
              const nx = dx / dist;
              const ny = dy / dist;
              Body.setVelocity(body, {
                x: body.velocity.x + nx * 13 * falloff,
                y: body.velocity.y + (ny * 9 - 8.5) * falloff,
              });
              Body.setAngularVelocity(
                body,
                body.angularVelocity + (Math.random() - 0.5) * 0.28 * falloff,
              );
            });
            wakeAll();
          }

          cachedRect = null;
          dragged = null;
          emptyPress = false;
          pointerId = -1;
          if (movedRef.current > 8) {
            window.setTimeout(() => {
              movedRef.current = 0;
            }, 0);
          }
        };

        host.addEventListener('pointerdown', onPointerDown);
        host.addEventListener('pointermove', onPointerMove);
        host.addEventListener('pointerup', onPointerUp);
        host.addEventListener('pointercancel', onPointerUp);
        window.addEventListener('scroll', invalidateRect, { passive: true });

        const observer = new IntersectionObserver((entries) => {
          visible = entries[0]?.isIntersecting ?? false;
          if (visible && !hasHoppedRef.current) {
            hasHoppedRef.current = true;
            actionsRef.current?.hopAll?.();
          }
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
          invalidateRect();
          width = host.clientWidth;
          height = host.clientHeight;
          halfSizes = buttons.map((button) => [
            button.offsetWidth / 2,
            button.offsetHeight / 2,
          ]);
          Composite.remove(engine.world, walls);
          walls = makeWalls();
          Composite.add(engine.world, walls);
          bodies.forEach((body) =>
            Body.setPosition(body, {
              x: Math.max(40, Math.min(width - 40, body.position.x)),
              y: Math.max(30, Math.min(height - 30, body.position.y)),
            }),
          );
          wakeAll();
        });
        resizeObserver.observe(host);

        cleanup = () => {
          actionsRef.current = null;
          cancelAnimationFrame(frame);
          observer.disconnect();
          resizeObserver.disconnect();
          window.removeEventListener('scroll', invalidateRect);
          document.removeEventListener('visibilitychange', updateLoop);
          host.removeEventListener('pointerdown', onPointerDown);
          host.removeEventListener('pointermove', onPointerMove);
          host.removeEventListener('pointerup', onPointerUp);
          host.removeEventListener('pointercancel', onPointerUp);
          host.removeEventListener('focusin', onFocusIn);
          host.removeEventListener('focusout', onFocusOut);
          host.classList.remove('is-physics', 'is-simulating');
          host.style.cursor = '';
          host.style.touchAction = '';
          hideRubberBand();
          buttons.forEach((button) => {
            button.classList.remove('is-dragging');
            button.style.transform = '';
            button.style.cursor = '';
          });
          Composite.clear(engine.world, false, true);
          Engine.clear(engine);
        };
      });
    };

    ensureInitRef.current = startInit;
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          preloadObserver.disconnect();
          startInit();
        }
      },
      { rootMargin: '250px' },
    );
    preloadObserver.observe(host);

    return () => {
      disposed = true;
      ensureInitRef.current = null;
      preloadObserver.disconnect();
      cleanup();
    };
  }, [reduced]);

  return (
    <section id="lab" className="section mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <SectionHeading
        index="03"
        eyebrow={t('lab.eyebrow')}
        title={t('lab.title')}
        intro={t('lab.intro')}
        badgeTone="bubblegum"
        underlineTone="green"
      />

      <Paper
        ref={paperRef}
        stock="paper"
        tape="corner"
        tapeKind="clear"
        tilt={0.35}
        seed="lab-sticker-tray"
        data-st="paper-drop"
        data-st-lab="stack"
        className="flex flex-col gap-4 p-5 pt-8 sm:p-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-script text-2xl font-bold text-ink">{t('lab.stackTitle')}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              seed="stack-shake-btn"
              className="cursor-pointer"
              onClick={() => {
                ensureInitRef.current?.();
                actionsRef.current?.scatter();
              }}
            >
              {t('lab.stackShake')}
            </Button>
            <Button
              type="button"
              variant={floating ? 'secondary' : 'outline'}
              size="xs"
              seed="stack-float-btn"
              className="cursor-pointer"
              aria-pressed={floating}
              onClick={() => {
                ensureInitRef.current?.();
                setFloating((prev) => !prev);
              }}
            >
              {t(floating ? 'lab.stackDrop' : 'lab.stackFloat')}
            </Button>
          </div>
        </div>

        <div
          className="stack-stage a3-drafting-tray rounded-lg border-2 border-ink"
          ref={stage}
          data-motion={reduced ? 'static' : 'physics'}
        >
          <svg
            className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible"
            aria-hidden="true"
          >
            <line
              ref={rubberLineRef}
              stroke="#ee6c3b"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              strokeLinecap="round"
              visibility="hidden"
            />
            <circle ref={rubberDotStartRef} r="4" fill="#ee6c3b" stroke="#1d242c" strokeWidth="1.5" visibility="hidden" />
            <circle ref={rubberDotEndRef} r="4.5" fill="#fff18f" stroke="#1d242c" strokeWidth="1.5" visibility="hidden" />
          </svg>

          {SKILLS.map((skill, index) => (
            <button
              type="button"
              className="stack-chip"
              key={skill}
              style={
                {
                  '--chip-bg': STICKER_COLORS[index % STICKER_COLORS.length],
                  borderRadius: CHIP_RADII[index % CHIP_RADII.length],
                } as React.CSSProperties
              }
              aria-pressed={activeSkill === skill}
              onClick={() => {
                if (movedRef.current > 8) return;
                onSelect(activeSkill === skill ? null : skill);
                actionsRef.current?.bounceChip(index);
              }}
            >
              <span className="stack-chip-dot" aria-hidden="true" />
              <span>{skill}</span>
            </button>
          ))}
        </div>

        <div className="flex min-h-7 flex-wrap items-center gap-2 text-sm text-ink-soft" aria-live="polite">
          {activeSkill ? (
            <>
              <Badge tone="lemon" size="sm" seed="stack-selected-badge" className="font-mono text-xs text-ink">
                {activeSkill}
              </Badge>
              <span>
                {related.length > 0 ? related.map((project) => project.name).join(' · ') : t('lab.noMatch')}
              </span>
            </>
          ) : null}
        </div>
      </Paper>
    </section>
  );
}
