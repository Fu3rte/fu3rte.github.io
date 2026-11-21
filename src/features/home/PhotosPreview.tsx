import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Paper } from '@/components/ui/paper';
import { useReducedMotion } from '@/hooks/use-live-motion';
import type { TapeKind } from '@/lib/ink/paper/props';
import { t, tObject, useLanguage } from '../../shared/i18n';
import { Link } from '../../shared/router';
import FlippablePolaroid, { type PhotoDetail } from '../photos/FlippablePolaroid';
import photo01 from '../photos/assets/photo-01.webp';
import photo02 from '../photos/assets/photo-02.webp';
import photo03 from '../photos/assets/photo-03.webp';
import photo06 from '../photos/assets/photo-06.webp';
import photo08 from '../photos/assets/photo-08.webp';
import photo10 from '../photos/assets/photo-10.webp';
import SectionHeading from './SectionHeading';

type PreviewCardItem = {
  src: string;
  noteIdx: number;
  tapeKind: TapeKind;
};

const PREVIEW_ROLL: readonly PreviewCardItem[] = [
  { src: photo01, noteIdx: 0, tapeKind: 'masking' },
  { src: photo02, noteIdx: 1, tapeKind: 'washi-dots' },
  { src: photo03, noteIdx: 2, tapeKind: 'washi-stripes' },
  { src: photo06, noteIdx: 5, tapeKind: 'washi-gingham' },
  { src: photo08, noteIdx: 7, tapeKind: 'clear' },
  { src: photo10, noteIdx: 9, tapeKind: 'masking' },
] as const;

type FanPose = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  zIndex: number;
};

function getFanPose(rel: number, isHovered: boolean, compact: boolean): FanPose {
  const spread = compact ? 0.62 : 1;
  switch (rel) {
    case 0:
      return { x: 0, y: 0, rotate: -1.5, scale: 1, zIndex: 30 };
    case 1:
      return {
        x: Math.round((isHovered ? 52 : 30) * spread),
        y: isHovered ? 10 : 8,
        rotate: isHovered ? 8.5 : 5.2,
        scale: 0.96,
        zIndex: 25,
      };
    case 2:
      return {
        x: Math.round((isHovered ? -50 : -28) * spread),
        y: isHovered ? 16 : 13,
        rotate: isHovered ? -9 : -5.5,
        scale: 0.93,
        zIndex: 20,
      };
    case 3:
      return {
        x: Math.round((isHovered ? 70 : 42) * spread),
        y: isHovered ? 24 : 20,
        rotate: isHovered ? 12.5 : 8.2,
        scale: 0.9,
        zIndex: 15,
      };
    case 4:
      return {
        x: Math.round((isHovered ? -64 : -38) * spread),
        y: isHovered ? 30 : 25,
        rotate: isHovered ? -12 : -7.8,
        scale: 0.87,
        zIndex: 10,
      };
    default:
      return {
        x: Math.round((isHovered ? 24 : 14) * spread),
        y: isHovered ? 36 : 30,
        rotate: isHovered ? 5 : 3,
        scale: 0.84,
        zIndex: 5,
      };
  }
}

export default function PhotosPreview() {
  useLanguage();
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion(stageRef);

  const [activeIdx, setActiveIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragDeltaXRef = useRef(0);
  const cardOuterRefs = useRef(new Map<number, HTMLDivElement>());
  const cardInnerRefs = useRef(new Map<number, HTMLDivElement>());
  const transitionRef = useRef<{ prevIdx: number; dir: 1 | -1 } | null>(null);
  const ignoreClickRef = useRef<number | null>(null);
  const pointerStateRef = useRef<{
    cardIndex: number;
    pointerId: number;
    startX: number;
    startY: number;
    maxMove: number;
  } | null>(null);

  const rawNotes = tObject<string[]>('photos.notes');
  const notes = Array.isArray(rawNotes) ? rawNotes : [];
  const rawDetails = tObject<PhotoDetail[]>('photos.details');
  const details = Array.isArray(rawDetails) ? rawDetails : [];

  const count = PREVIEW_ROLL.length;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const stepTo = useCallback(
    (nextIndex: number, dir: 1 | -1) => {
      const normalized = ((nextIndex % count) + count) % count;
      if (normalized === activeIdx) {
        setFlipped(false);
        return;
      }
      transitionRef.current = { prevIdx: activeIdx, dir };
      setActiveIdx(normalized);
      setFlipped(false);
    },
    [activeIdx, count],
  );

  const nextCard = useCallback(() => {
    stepTo(activeIdx + 1, -1);
  }, [activeIdx, stepTo]);

  const prevCard = useCallback(() => {
    stepTo(activeIdx - 1, 1);
  }, [activeIdx, stepTo]);

  const selectCard = useCallback(
    (targetIdx: number) => {
      if (targetIdx === activeIdx) {
        setFlipped(false);
        return;
      }
      stepTo(targetIdx, 1);
    },
    [activeIdx, stepTo],
  );

  useLayoutEffect(() => {
    const transition = transitionRef.current;
    transitionRef.current = null;
    if (!transition || reducedMotion) return;

    const incomingEl = cardInnerRefs.current.get(activeIdx);
    const outgoingEl = cardInnerRefs.current.get(transition.prevIdx);

    if (incomingEl) {
      gsap.killTweensOf(incomingEl);
      gsap.fromTo(
        incomingEl,
        { y: 12, scale: 0.96, rotation: transition.dir * -3 },
        {
          y: 0,
          scale: 1,
          rotation: 0,
          duration: 0.38,
          ease: 'back.out(1.45)',
          clearProps: 'transform',
        },
      );
    }

    if (outgoingEl && outgoingEl !== incomingEl) {
      gsap.killTweensOf(outgoingEl);
      gsap.fromTo(
        outgoingEl,
        { x: transition.dir * 46, y: -10, rotation: transition.dir * 6 },
        {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.44,
          ease: 'power3.out',
          clearProps: 'transform',
        },
      );
    }
  }, [activeIdx, reducedMotion]);

  const markClickHandled = (cardIndex: number) => {
    ignoreClickRef.current = cardIndex;
    window.setTimeout(() => {
      if (ignoreClickRef.current === cardIndex) {
        ignoreClickRef.current = null;
      }
    }, 80);
  };

  const handleFrontPointerDown = (cardIndex: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerStateRef.current = {
      cardIndex,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      maxMove: 0,
    };
    dragDeltaXRef.current = 0;
    const outerEl = cardOuterRefs.current.get(cardIndex);
    if (outerEl) {
      outerEl.style.transition = 'none';
    }
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore capture errors on synthetic pointers
    }
  };

  const handleFrontPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    state.maxMove = Math.max(state.maxMove, Math.hypot(dx, dy));
    dragDeltaXRef.current = dx;
    const outerEl = cardOuterRefs.current.get(state.cardIndex);
    if (outerEl) {
      const pose = getFanPose(0, isHovered, isCompact);
      outerEl.style.transition = 'none';
      outerEl.style.transform = `translate3d(calc(-50% + ${pose.x + dx}px), ${pose.y + Math.abs(dx) * 0.06}px, 0) rotate(${pose.rotate + dx * 0.045}deg) scale(${pose.scale})`;
    }
  };

  const finishFrontPointer = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const state = pointerStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    pointerStateRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }

    const dx = e.clientX - state.startX;
    dragDeltaXRef.current = 0;
    const willAdvance = !cancelled && (Math.abs(dx) > 45 || state.maxMove < 8);
    const outerEl = cardOuterRefs.current.get(state.cardIndex);
    if (outerEl) {
      const pose = getFanPose(0, isHovered, isCompact);
      outerEl.style.transition = reducedMotion
        ? 'none'
        : 'transform 440ms cubic-bezier(0.22, 1, 0.36, 1)';
      if (!willAdvance) {
        outerEl.style.transform = `translate3d(calc(-50% + ${pose.x}px), ${pose.y}px, 0) rotate(${pose.rotate}deg) scale(${pose.scale})`;
      }
    }

    setIsDragging(false);
    markClickHandled(state.cardIndex);

    if (cancelled) return;

    if (Math.abs(dx) > 45) {
      if (dx < 0) {
        nextCard();
      } else {
        prevCard();
      }
      return;
    }

    if (state.maxMove < 8) {
      nextCard();
    }
  };

  const active = PREVIEW_ROLL[activeIdx];
  const activeFrameNum = String(active.noteIdx + 1).padStart(2, '0');
  const activeCaption = notes[active.noteIdx] ?? `#${activeFrameNum}`;
  const activeDetail = details[active.noteIdx] ?? { place: '', mood: '', note: '' };

  return (
    <section id="photo-preview" className="section mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <SectionHeading
        index="04"
        eyebrow={t('photos.eyebrow')}
        title={t('photos.title')}
        intro={t('photos.intro')}
        badgeTone="lemon"
        underlineTone="orange"
      />

      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div
          ref={stageRef}
          data-st="photo-deck"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative mx-auto h-[370px] w-full max-w-[340px] touch-pan-y select-none sm:h-[420px] sm:max-w-[400px]"
        >
          {PREVIEW_ROLL.map((item, i) => {
            const rel = (i - activeIdx + count) % count;
            const isFront = rel === 0;
            const pose = getFanPose(rel, isHovered, isCompact);

            const frameNum = String(item.noteIdx + 1).padStart(2, '0');
            const caption = notes[item.noteIdx] ?? `#${frameNum}`;
            const detail = details[item.noteIdx] ?? { place: '', mood: '', note: '' };
            const isCardFlipped = isFront && flipped;

            return (
              <div
                key={item.noteIdx}
                ref={(el) => {
                  if (el) cardOuterRefs.current.set(i, el);
                  else cardOuterRefs.current.delete(i);
                }}
                role="button"
                tabIndex={0}
                aria-label={`${t('photos.alt')} ${frameNum} — ${caption}`}
                onClick={() => {
                  if (ignoreClickRef.current === i) {
                    ignoreClickRef.current = null;
                    return;
                  }
                  if (isFront) nextCard();
                  else selectCard(i);
                }}
                onPointerDown={isFront ? (e) => handleFrontPointerDown(i, e) : undefined}
                onPointerMove={isFront ? handleFrontPointerMove : undefined}
                onPointerUp={isFront ? (e) => finishFrontPointer(e, false) : undefined}
                onPointerCancel={isFront ? (e) => finishFrontPointer(e, true) : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isFront) nextCard();
                    else selectCard(i);
                  } else if (isFront && e.key === 'ArrowLeft') {
                    e.preventDefault();
                    prevCard();
                  } else if (isFront && e.key === 'ArrowRight') {
                    e.preventDefault();
                    nextCard();
                  }
                }}
                style={{
                  zIndex: pose.zIndex,
                  transform: `translate3d(calc(-50% + ${pose.x}px), ${pose.y}px, 0) rotate(${pose.rotate}deg) scale(${pose.scale})`,
                  transition:
                    (isFront && isDragging) || reducedMotion
                      ? 'none'
                      : 'transform 440ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className={`absolute top-5 left-1/2 w-[216px] touch-pan-y focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus sm:top-6 sm:w-[270px] ${
                  isFront ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'
                }`}
              >
                <div
                  ref={(el) => {
                    if (el) cardInnerRefs.current.set(i, el);
                    else cardInnerRefs.current.delete(i);
                  }}
                >
                  <FlippablePolaroid
                    src={item.src}
                    alt={`${t('photos.alt')} ${frameNum}`}
                    frameNum={frameNum}
                    caption={caption}
                    detail={detail}
                    tapeKind={item.tapeKind}
                    seed={`home-polaroid-${frameNum}`}
                    flippable={isFront}
                    flipped={isCardFlipped}
                    reducedMotion={reducedMotion}
                    variant="deck"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div data-st="photo-index-scrub">
          <Paper
            stock="index-card"
            rules="index"
            fastener="clip"
            fastenerTone="grass"
            tilt={0.75}
            seed="photos-index-card"
            data-st="paper-drop"
            className="p-5 pt-11 sm:p-7"
          >
            <div className="flex items-center justify-between gap-3 pe-10">
              <span className="font-mono text-xs font-bold tracking-[0.14em] text-ink-muted uppercase">
                {t('photos.rollLabel')}
              </span>
              <span className="font-mono text-xs font-bold tabular-nums text-ink-you">
                0{activeIdx + 1} / 06
              </span>
            </div>

            <h3 className="mt-3 font-script text-2xl font-bold text-ink sm:text-[1.75rem]">
              {activeCaption}
            </h3>

            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              {activeDetail.place ? (
                <Badge
                  tone="lemon"
                  size="sm"
                  seed={`photos-place-${active.noteIdx}`}
                  className="font-mono text-xs text-ink"
                >
                  {activeDetail.place}
                </Badge>
              ) : null}
              {activeDetail.mood ? (
                <span className="font-mono text-xs font-semibold text-ink-muted">
                  {activeDetail.mood}
                </span>
              ) : null}
            </div>

            {activeDetail.note ? (
              <p className="mt-3 min-h-[3.25rem] text-[15px] leading-relaxed text-ink-soft sm:text-[16px]">
                {activeDetail.note}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-6 gap-2" role="group" aria-label={t('photos.rollLabel')}>
              {PREVIEW_ROLL.map((frame, i) => {
                const isActive = i === activeIdx;
                const frameNum = String(frame.noteIdx + 1).padStart(2, '0');
                return (
                  <button
                    key={frame.noteIdx}
                    type="button"
                    onClick={() => selectCard(i)}
                    aria-pressed={isActive}
                    aria-label={`${t('photos.alt')} ${frameNum}`}
                    className={`group relative cursor-pointer overflow-hidden rounded-[2px] border border-ink/75 bg-card p-1 pb-1.5 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                      isActive
                        ? '-translate-y-1 opacity-100 shadow-sm ring-2 ring-marker'
                        : 'opacity-60 hover:-translate-y-0.5 hover:opacity-100'
                    }`}
                  >
                    <div className="aspect-square w-full overflow-hidden bg-paper-shade/60">
                      <img
                        src={frame.src}
                        alt=""
                        width={160}
                        height={160}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                    <span className="mt-1 block text-center font-mono text-[9px] leading-none font-bold text-ink-muted">
                      {frameNum}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-pencil-mark/60 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  seed="photos-prev-btn"
                  aria-label={t('photos.prev')}
                  onClick={prevCard}
                  className="cursor-pointer"
                >
                  ←
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  seed="photos-next-btn"
                  aria-label={t('photos.next')}
                  onClick={nextCard}
                  className="cursor-pointer"
                >
                  →
                </Button>
                <Button
                  type="button"
                  variant={flipped ? 'secondary' : 'outline'}
                  size="sm"
                  seed="photos-flip-btn"
                  aria-pressed={flipped}
                  onClick={() => setFlipped((prev) => !prev)}
                  className="cursor-pointer"
                >
                  {t(flipped ? 'photos.front' : 'photos.flip')}
                </Button>
              </div>

              <Button asChild variant="default" size="sm" seed="photos-open-all" className="cursor-pointer">
                <Link to="/photos">{t('photos.open')}</Link>
              </Button>
            </div>
          </Paper>
        </div>
      </div>
    </section>
  );
}
