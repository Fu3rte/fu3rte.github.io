import { useRef, useState } from 'react';
import gsap from 'gsap';
import { Arrow } from '@/components/ui/arrow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Handwritten } from '@/components/ui/handwritten';
import { Paper } from '@/components/ui/paper';
import { Underline } from '@/components/ui/underline';
import { t, tObject, useLanguage } from '../../shared/i18n';

type SwatchItem = {
  code: string;
  label: string;
  tag: string;
};

const SWATCH_STOCKS = ['sticky-green', 'sticky-yellow', 'sticky-pink', 'sticky-blue'] as const;
const SWATCH_ROTATE_CLASS = ['-rotate-3', '-rotate-1', 'rotate-1', 'rotate-3'] as const;

const SPECIMEN_DOTS = [
  { hex: '#fcfdfd', border: 'border-ink/40' },
  { hex: '#88cfba', border: 'border-ink/20' },
  { hex: '#fff18f', border: 'border-ink/20' },
  { hex: '#ee6c3b', border: 'border-ink/20' },
  { hex: '#1d242c', border: 'border-ink/20' },
] as const;

const STAMP_EMBLEMS = ['starburst', 'coffee', 'cat', 'nib'] as const;

function formatLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function StampEmblem({ kind }: { kind: (typeof STAMP_EMBLEMS)[number] }) {
  if (kind === 'starburst') {
    return (
      <svg aria-hidden="true" viewBox="0 0 40 40" className="size-10" fill="none">
        <path
          d="M20 4L23.2 14.2L33.5 10.5L26.2 18.8L36 22L25.6 24.4L31 33.5L21.5 27.6L18.5 36L16.5 26.8L6.5 30.2L13.6 22.2L4.5 18.2L14.8 16.5L11 7.2L19 14Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="20" r="2.8" fill="currentColor" />
      </svg>
    );
  }
  if (kind === 'coffee') {
    return (
      <svg aria-hidden="true" viewBox="0 0 40 40" className="size-10" fill="none">
        <path
          d="M15 9C14.2 11.2 16.2 12.6 15.2 14.8M21 8.5C20.2 10.8 22.2 12.2 21.2 14.5M27 9.5C26.2 11.5 28 13 27 15"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M10.5 18.5H27.5V26.5C27.5 30.5 24.5 33 19 33C13.5 33 10.5 30.5 10.5 26.5V18.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M27.5 20.5H30.5C32.4 20.5 33.5 21.8 33.5 23.8C33.5 25.8 32.2 27.2 30.2 27.2H27.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === 'cat') {
    return (
      <svg aria-hidden="true" viewBox="0 0 40 40" className="size-10" fill="none">
        <path
          d="M10.5 21C10.5 15 13.5 12.5 14.5 9L18.5 12.5C19.5 12.2 20.5 12.2 21.5 12.5L25.5 9C26.5 12.5 29.5 15 29.5 21C29.5 27.2 25.4 31.2 20 31.2C14.6 31.2 10.5 27.2 10.5 21Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="16.5" cy="20.5" r="1.4" fill="currentColor" />
        <circle cx="23.5" cy="20.5" r="1.4" fill="currentColor" />
        <path d="M18.8 23.6L20 24.8L21.2 23.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 21.5H12.5M7.5 24.5H12.2M27.5 21.5H32.5M27.8 24.5H32.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className="size-10" fill="none">
      <path
        d="M20 7L28 21L24 31H16L12 21L20 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M20 7V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="20" cy="20.5" r="2" fill="currentColor" />
      <path d="M15 34.5H25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SwatchMotif({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg aria-hidden="true" viewBox="0 0 28 28" className="size-6 shrink-0 text-ink/80" fill="none">
        <rect x="3" y="3" width="22" height="22" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10.5 3V25M17.5 3V25M3 10.5H25M3 17.5H25" stroke="#2d8a56" strokeWidth="1.2" opacity="0.7" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg aria-hidden="true" viewBox="0 0 28 28" className="size-6 shrink-0 text-ink/80" fill="none">
        <path d="M4 22H24M4 17H16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
        <path d="M17.5 4.5L23.5 10.5L15 19L10.5 20.5L12 16L17.5 4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M10.5 20.5L15 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (index === 2) {
    return (
      <svg aria-hidden="true" viewBox="0 0 28 28" className="size-6 shrink-0 text-ink/80" fill="none">
        <path
          d="M5 10.5L22 7L23.5 16.5L6.5 20L5 10.5Z"
          fill="#ffffff"
          fillOpacity="0.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9.5 11.5L19 9.5M10.5 15.5L20 13.5" stroke="#ee6c3b" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className="size-6 shrink-0 text-ink/80" fill="none">
      <rect x="4.5" y="3.5" width="19" height="21" rx="2" fill="#ffffff" fillOpacity="0.75" stroke="currentColor" strokeWidth="1.6" />
      <rect x="7.5" y="6.5" width="13" height="11" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 14.5L12.5 11.5L15.5 14L17.5 12.2L19.5 14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SketchHero() {
  useLanguage();
  const swatches = tObject<SwatchItem[]>('hero.swatches');
  const [stampIndex, setStampIndex] = useState(0);
  const [activeSwatch, setActiveSwatch] = useState<number>(0);
  const stampRef = useRef<HTMLButtonElement | null>(null);
  const dateLabel = formatLocalDate();

  const handleStamp = () => {
    setStampIndex((prev) => (prev + 1) % STAMP_EMBLEMS.length);
    const el = stampRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(
      el,
      { scale: 1.25, rotate: -14 },
      { scale: 1, rotate: -4, duration: 0.4, ease: 'back.out(2)', overwrite: true },
    );
  };

  return (
    <section
      id="home"
      className="section relative mx-auto flex min-h-[calc(100svh-56px)] max-w-6xl items-center px-5 py-12 sm:px-8 sm:py-16"
    >
      <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
        <div className="flex flex-col items-start gap-6" data-st="hero-copy">
          <div data-st="hero-enter">
            <Badge tone="teal" size="lg" seed="hero-kicker" className="text-ink">
              {t('hero.kicker')}
            </Badge>
          </div>

          <h1
            data-st="hero-enter"
            className="font-script text-[2.35rem] leading-[1.15] font-bold tracking-tight text-balance text-ink sm:text-[3.35rem] lg:text-[3.6rem]"
          >
            <Handwritten strength={0.65} seed="hero-h1-prefix">
              {t('hero.titlePrefix')}
            </Handwritten>
            <mark className="inline-block px-1.5 py-0.5">
              <Underline kind="double" tone="marker" seed="hero-h1-ul">
                {t('hero.titleHighlight')}
              </Underline>
            </mark>
            <span>{t('hero.titleSuffix')}</span>
          </h1>

          <p data-st="hero-enter" className="font-mono text-sm tracking-wide text-ink-soft sm:text-[15px]">
            {t('hero.motif')}
          </p>

          <div data-st="hero-enter" className="flex flex-wrap items-center gap-4 pt-1">
            <Button asChild size="lg" variant="default" seed="hero-works-btn" className="cursor-pointer">
              <a href="#works">{t('hero.primary')}</a>
            </Button>
            <Button asChild size="lg" variant="outline" seed="hero-contact-btn" className="cursor-pointer">
              <a href="#contact">{t('hero.secondary')}</a>
            </Button>
            <Arrow
              direction="right"
              curve="curved"
              tone="green"
              seed="hero-to-desk"
              className="hidden lg:inline-block"
            />
          </div>
        </div>

        <div className="relative flex flex-col gap-5 sm:px-2">
          <div data-st="hero-layer-1">
            <div data-st="hero-enter">
              <Paper
                stock="index-card"
                rules="index"
                tape="top"
                tapeKind="washi-stripes"
                fastener="clip"
                fastenerTone="tomato"
                tilt={-1.1}
                seed="hero-desk-slip"
                className="px-6 pt-11 pb-6 sm:px-8"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="font-mono text-xs font-bold tracking-[0.16em] text-red uppercase">
                      {t('hero.stampLabel')}
                    </span>
                    <time dateTime={dateLabel.replace(/\./g, '-')} className="font-mono text-xl font-bold tracking-tight text-ink">
                      {dateLabel}
                    </time>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 180 28"
                      className="mt-1 h-7 w-44 text-ink-soft"
                      fill="none"
                    >
                      <path d="M2 22H142" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path
                        d="M8 22V15M20 22V17.5M32 22V13M44 22V17.5M56 22V15M68 22V17.5M80 22V13M92 22V17.5M104 22V15M116 22V17.5M128 22V13M140 22V17.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M150 18L165 6L173 10L160 22L150 23.5L150 18Z"
                        stroke="#1d242c"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                      <path d="M161 12L166 14.5" stroke="#ee6c3b" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </div>

                  <button
                    ref={stampRef}
                    type="button"
                    onClick={handleStamp}
                    aria-label={`${t('hero.stampLabel')} · ${STAMP_EMBLEMS[stampIndex]}`}
                    style={{ transform: 'rotate(-4deg)' }}
                    className="relative flex size-20 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-red/80 bg-paper/75 text-red transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-focus"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-1.5 rounded-full border border-red/50"
                    />
                    <StampEmblem kind={STAMP_EMBLEMS[stampIndex]!} />
                  </button>
                </div>
              </Paper>
            </div>
          </div>

          <div data-st="hero-layer-2">
            <div data-st="hero-enter">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2.5">
                {swatches.map((swatch, idx) => {
                  const active = activeSwatch === idx;
                  const stock = SWATCH_STOCKS[idx % SWATCH_STOCKS.length]!;
                  const restRotate = SWATCH_ROTATE_CLASS[idx % SWATCH_ROTATE_CLASS.length]!;

                  return (
                    <button
                      key={swatch.code}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveSwatch(idx)}
                      className={`group relative cursor-pointer text-left transition-transform duration-200 ease-out focus-visible:outline-2 focus-visible:outline-focus ${
                        active
                          ? 'z-30 -translate-y-2.5 scale-[1.03] rotate-0'
                          : `z-10 ${restRotate} hover:z-20 hover:-translate-y-2 hover:rotate-0`
                      }`}
                    >
                      <Paper
                        stock={stock}
                        tilt={false}
                        seed={`hero-swatch-${swatch.code}`}
                        className={`flex h-full w-full flex-col justify-between gap-2.5 p-3.5 pt-4 ${
                          active ? 'ring-2 ring-ink/45' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="font-mono text-[11px] font-bold tracking-wider text-ink-muted">
                            {swatch.code}
                          </span>
                          <SwatchMotif index={idx} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-script text-lg leading-tight font-bold text-ink">
                            {swatch.label}
                          </span>
                          <span className="font-mono text-[10px] leading-tight text-ink-soft">
                            {swatch.tag}
                          </span>
                        </div>
                      </Paper>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div data-st="hero-layer-3">
            <div data-st="hero-enter">
              <Paper
                stock="receipt"
                tilt={0.8}
                seed="hero-specimen-slip"
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="flex items-center gap-2.5" aria-hidden="true">
                  {SPECIMEN_DOTS.map((dot) => (
                    <span
                      key={dot.hex}
                      className={`size-4 rounded-full border ${dot.border}`}
                      style={{ backgroundColor: dot.hex }}
                    />
                  ))}
                </div>

                <svg
                  aria-hidden="true"
                  viewBox="0 0 120 24"
                  className="h-6 w-28 shrink-0 text-ink"
                  fill="none"
                >
                  <path
                    d="M4 15C14 5 22 21 34 11C45 2 55 20 68 12C79 5 90 19 102 10C106 7 110 8 113 11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="116" cy="14" r="2" fill="#ee6c3b" />
                </svg>
              </Paper>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
