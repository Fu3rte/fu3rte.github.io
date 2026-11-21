import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Handwritten } from '@/components/ui/handwritten';
import { Polaroid, PolaroidCaption, PolaroidImage } from '@/components/ui/polaroid';
import { Separator } from '@/components/ui/separator';
import { Underline } from '@/components/ui/underline';
import { useReducedMotion } from '@/hooks/use-live-motion';
import type { TapeKind } from '@/lib/ink/paper/props';
import { t, tObject, useLanguage } from '../../shared/i18n';
import { initPhotosMotion } from '../../shared/motion';
import { Link } from '../../shared/router';
import FlippablePolaroid, { type PhotoDetail } from './FlippablePolaroid';
import photo01 from './assets/photo-01.webp';
import photo02 from './assets/photo-02.webp';
import photo03 from './assets/photo-03.webp';
import photo04 from './assets/photo-04.webp';
import photo05 from './assets/photo-05.webp';
import photo06 from './assets/photo-06.webp';
import photo07 from './assets/photo-07.webp';
import photo08 from './assets/photo-08.webp';
import photo09 from './assets/photo-09.webp';
import photo10 from './assets/photo-10.webp';

type GalleryItem = {
  src: string;
  tapeKind: TapeKind;
  rotateClass: string;
  staggerClass: string;
};

const GALLERY_ITEMS: readonly GalleryItem[] = [
  { src: photo01, tapeKind: 'washi-dots', rotateClass: 'rotate-[-1.8deg]', staggerClass: '' },
  { src: photo02, tapeKind: 'masking', rotateClass: 'rotate-[1.3deg]', staggerClass: 'sm:mt-6 lg:mt-8' },
  { src: photo03, tapeKind: 'washi-stripes', rotateClass: 'rotate-[-0.9deg]', staggerClass: 'lg:mt-3' },
  { src: photo04, tapeKind: 'washi-gingham', rotateClass: 'rotate-[1.7deg]', staggerClass: 'sm:mt-6 lg:mt-0' },
  { src: photo05, tapeKind: 'clear', rotateClass: 'rotate-[-1.4deg]', staggerClass: 'lg:mt-8' },
  { src: photo06, tapeKind: 'washi-dots', rotateClass: 'rotate-[0.8deg]', staggerClass: 'sm:mt-6 lg:mt-3' },
  { src: photo07, tapeKind: 'masking', rotateClass: 'rotate-[-1.5deg]', staggerClass: '' },
  { src: photo08, tapeKind: 'washi-stripes', rotateClass: 'rotate-[1.2deg]', staggerClass: 'sm:mt-6 lg:mt-8' },
  { src: photo09, tapeKind: 'washi-gingham', rotateClass: 'rotate-[-0.7deg]', staggerClass: 'lg:mt-3' },
  { src: photo10, tapeKind: 'clear', rotateClass: 'rotate-[1.6deg]', staggerClass: 'sm:mt-6 lg:mt-2' },
] as const;

export default function PhotosPage() {
  useLanguage();
  useEffect(initPhotosMotion, []);

  const reducedMotion = useReducedMotion();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lightboxFlipped, setLightboxFlipped] = useState(false);

  const lightboxDialogRef = useRef<HTMLDivElement>(null);
  const lightboxCardRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const slideDirRef = useRef<1 | -1 | 0>(0);

  const rawNotes = tObject<string[]>('photos.notes');
  const notes = Array.isArray(rawNotes) ? rawNotes : [];
  const rawDetails = tObject<PhotoDetail[]>('photos.details');
  const details = Array.isArray(rawDetails) ? rawDetails : [];

  const total = GALLERY_ITEMS.length;

  const openLightbox = useCallback((index: number) => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    slideDirRef.current = 0;
    setSelectedIndex(index);
    setLightboxFlipped(false);
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
    setLightboxFlipped(false);
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    requestAnimationFrame(() => target?.focus());
  }, []);

  const prevPhoto = useCallback(() => {
    slideDirRef.current = -1;
    setSelectedIndex((idx) => (idx === null ? null : (idx - 1 + total) % total));
    setLightboxFlipped(false);
  }, [total]);

  const nextPhoto = useCallback(() => {
    slideDirRef.current = 1;
    setSelectedIndex((idx) => (idx === null ? null : (idx + 1) % total));
    setLightboxFlipped(false);
  }, [total]);

  useEffect(() => {
    if (selectedIndex === null) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPhoto();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextPhoto();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedIndex, closeLightbox, prevPhoto, nextPhoto]);

  useLayoutEffect(() => {
    if (selectedIndex === null || reducedMotion) return;
    const dialogEl = lightboxDialogRef.current;
    if (dialogEl && slideDirRef.current === 0) {
      gsap.killTweensOf(dialogEl);
      gsap.fromTo(
        dialogEl,
        { opacity: 0, scale: 0.94, y: 12 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.24,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
      );
      return;
    }

    const cardEl = lightboxCardRef.current;
    const dir = slideDirRef.current;
    if (cardEl && dir !== 0) {
      slideDirRef.current = 0;
      gsap.killTweensOf(cardEl);
      gsap.fromTo(
        cardEl,
        { opacity: 0.65, x: dir * 24 },
        {
          opacity: 1,
          x: 0,
          duration: 0.22,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
      );
    }
  }, [selectedIndex, reducedMotion]);

  const selectedItem = selectedIndex !== null ? GALLERY_ITEMS[selectedIndex] : null;
  const selectedNum = selectedIndex !== null ? String(selectedIndex + 1).padStart(2, '0') : '01';
  const selectedCaption = selectedIndex !== null ? (notes[selectedIndex] ?? `#${selectedNum}`) : '';
  const selectedDetail =
    selectedIndex !== null
      ? (details[selectedIndex] ?? { place: '', mood: '', note: '' })
      : { place: '', mood: '', note: '' };

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 pb-24 sm:px-8 sm:py-16">
      <section id="photos" className="section">
        <header className="mb-12 flex flex-col items-start gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              tone="lemon"
              size="default"
              seed="photos-page-badge"
              className="font-mono text-xs text-ink"
            >
              01
            </Badge>
            <span className="font-mono text-xs font-bold tracking-[0.16em] text-ink-muted uppercase">
              {t('photos.eyebrow')}
            </span>
          </div>

          <h1 className="section-title font-script text-5xl font-bold text-ink sm:text-6xl">
            <Underline kind="wavy" tone="orange" seed="photos-page-ul">
              <Handwritten strength={0.5} seed="photos-page-hw">
                {t('photos.title')}
              </Handwritten>
            </Underline>
          </h1>

          <p className="max-w-2xl text-[18px] leading-relaxed text-ink-soft">{t('photos.intro')}</p>

          <Button asChild variant="outline" size="sm" seed="photos-back-home">
            <Link to="/">{t('photos.back')}</Link>
          </Button>

          <Separator variant="dashed" seed="photos-page-sep" className="mt-2 opacity-75" />
        </header>

        <div className="grid grid-cols-1 items-start justify-items-center gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-12">
          {GALLERY_ITEMS.map((item, index) => {
            const num = String(index + 1).padStart(2, '0');
            return (
              <div
                key={item.src}
                data-st="polaroid-tile"
                className={`flex w-full justify-center ${item.staggerClass}`}
              >
                <button
                  type="button"
                  onClick={() => openLightbox(index)}
                  className={`group block w-full max-w-[300px] cursor-pointer text-start transition-transform duration-200 hover:-translate-y-1.5 hover:rotate-0 focus-visible:outline-none ${item.rotateClass}`}
                >
                  <Polaroid
                    as="div"
                    tape="top"
                    tapeKind={item.tapeKind}
                    tilt={false}
                    seed={`gallery-polaroid-${num}`}
                    className="w-full max-w-[300px] group-focus-visible:ring-2 group-focus-visible:ring-focus group-focus-visible:ring-offset-4"
                  >
                    <PolaroidImage date={`#${num}`}>
                      <img
                        src={item.src}
                        alt={`${t('photos.alt')} ${num}`}
                        width={760}
                        height={760}
                        loading={index < 3 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </PolaroidImage>
                    <PolaroidCaption>{notes[index] ?? `#${num}`}</PolaroidCaption>
                  </Polaroid>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {selectedIndex !== null && selectedItem
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${t('photos.alt')} ${selectedNum} — ${selectedCaption}`}
              onClick={(e) => {
                if (e.target === e.currentTarget) closeLightbox();
              }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-xs"
            >
              <div
                ref={lightboxDialogRef}
                className="flex w-full max-w-[380px] flex-col items-center gap-4"
              >
                <div ref={lightboxCardRef} className="w-full">
                  <FlippablePolaroid
                    src={selectedItem.src}
                    alt={`${t('photos.alt')} ${selectedNum}`}
                    frameNum={selectedNum}
                    caption={selectedCaption}
                    detail={selectedDetail}
                    tapeKind={selectedItem.tapeKind}
                    seed={`lightbox-polaroid-${selectedNum}`}
                    flipped={lightboxFlipped}
                    reducedMotion={reducedMotion}
                    loading="eager"
                    variant="lightbox"
                    onFlipToggle={() => setLightboxFlipped((prev) => !prev)}
                  />
                </div>

                <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border-2 border-ink bg-paper px-3 py-2 shadow-lg">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    seed="lightbox-prev"
                    aria-label={t('photos.prev')}
                    onClick={prevPhoto}
                    className="cursor-pointer"
                  >
                    ←
                  </Button>

                  <Button
                    type="button"
                    variant={lightboxFlipped ? 'secondary' : 'outline'}
                    size="sm"
                    seed="lightbox-flip"
                    aria-pressed={lightboxFlipped}
                    onClick={() => setLightboxFlipped((prev) => !prev)}
                    className="cursor-pointer"
                  >
                    {t(lightboxFlipped ? 'photos.front' : 'photos.flip')}
                  </Button>

                  <span className="font-mono text-xs font-bold tabular-nums text-ink-muted">
                    {selectedNum} / 10
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    seed="lightbox-next"
                    aria-label={t('photos.next')}
                    onClick={nextPhoto}
                    className="cursor-pointer"
                  >
                    →
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    seed="lightbox-close"
                    aria-label={t('photos.close')}
                    onClick={closeLightbox}
                    className="cursor-pointer"
                  >
                    ×
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </main>
  );
}
