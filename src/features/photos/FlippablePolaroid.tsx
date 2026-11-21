import { Polaroid, PolaroidCaption, PolaroidImage } from '@/components/ui/polaroid';
import type { TapeKind } from '@/lib/ink/paper/props';

export type PhotoDetail = {
  place: string;
  mood: string;
  note: string;
};

type FlippablePolaroidProps = {
  src: string;
  alt: string;
  frameNum: string;
  caption: string;
  detail: PhotoDetail;
  tapeKind: TapeKind;
  seed: string;
  flipped?: boolean;
  flippable?: boolean;
  reducedMotion?: boolean;
  loading?: 'eager' | 'lazy';
  variant?: 'deck' | 'lightbox';
  onFlipToggle?: () => void;
};

function PolaroidSignature({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 76 22" className={className} fill="none">
      <path
        d="M3 14C7 6 11 6 14 13C17 19 21 5 26 11C30 16 34 7 39 12C43 16 48 9 54 11C60 13 66 8 73 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 18C28 16.5 48 16 68 17"
        stroke="var(--ll-marker)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

export default function FlippablePolaroid({
  src,
  alt,
  frameNum,
  caption,
  detail,
  tapeKind,
  seed,
  flipped = false,
  flippable = true,
  reducedMotion = false,
  loading = 'lazy',
  variant = 'deck',
  onFlipToggle,
}: FlippablePolaroidProps) {
  const isLightbox = variant === 'lightbox';

  const frontPolaroid = (
    <Polaroid
      as="div"
      tape="top"
      tapeKind={tapeKind}
      tilt={false}
      seed={seed}
      className={isLightbox ? 'w-full shadow-xl' : 'w-full'}
    >
      <PolaroidImage date={`#${frameNum}`}>
        <img
          src={src}
          alt={alt}
          width={760}
          height={760}
          loading={loading}
          decoding="async"
          draggable={false}
        />
      </PolaroidImage>
      <PolaroidCaption
        className={isLightbox ? 'text-[1.8rem]' : 'text-[1.4rem] sm:text-[1.6rem]'}
      >
        {caption}
      </PolaroidCaption>
    </Polaroid>
  );

  if (!flippable) {
    return frontPolaroid;
  }

  return (
    <div className="polaroid-flip-scene w-full">
      <div
        onClick={onFlipToggle}
        className={`polaroid-flip-inner ${onFlipToggle ? 'cursor-pointer' : ''} ${
          flipped ? 'is-flipped' : ''
        } ${reducedMotion ? 'transition-none!' : ''}`}
      >
        <div className={`polaroid-face relative w-full ${flipped ? 'pointer-events-none' : ''}`}>
          {frontPolaroid}
        </div>

        <div
          aria-hidden={!flipped}
          className={`polaroid-face-back flex flex-col justify-between border-2 border-ink/80 bg-card p-5 text-ink ${
            isLightbox ? 'shadow-xl sm:p-6' : 'shadow-md'
          } ${flipped ? '' : 'pointer-events-none'}`}
        >
          <div
            className={`flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-pencil-mark/60 ${
              isLightbox ? 'pb-3' : 'pb-2'
            }`}
          >
            <span className="font-mono text-xs font-bold tracking-wider text-ink-muted">
              #{frameNum} / 10
            </span>
            {detail.place ? (
              <span
                className={`inline-block -rotate-2 rounded-xs border-[1.5px] border-dashed border-marker/85 bg-marker/10 font-mono font-bold tracking-wider text-orange-text uppercase ${
                  isLightbox ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[10px]'
                }`}
              >
                {detail.place}
              </span>
            ) : null}
          </div>

          <div
            className={`my-auto flex min-h-0 flex-col ${
              isLightbox ? 'gap-2.5 py-4' : 'gap-1.5 py-2.5'
            }`}
          >
            {detail.mood ? (
              <span
                className={`font-mono font-semibold tracking-wide text-ink-you ${
                  isLightbox ? 'text-xs' : 'text-[11px]'
                }`}
              >
                {detail.mood}
              </span>
            ) : null}
            <p
              className={`font-script font-semibold text-ink ${
                isLightbox
                  ? 'text-[1.35rem] leading-relaxed sm:text-[1.55rem]'
                  : 'text-[1.08rem] leading-snug sm:text-[1.25rem]'
              }`}
            >
              {detail.note || caption}
            </p>
          </div>

          <div
            className={`flex items-end justify-between border-t border-dashed border-pencil-mark/45 ${
              isLightbox ? 'gap-3 pt-3' : 'gap-2 pt-2'
            }`}
          >
            <span
              className={`truncate font-mono text-ink-muted ${
                isLightbox ? 'text-xs' : 'text-[11px]'
              }`}
            >
              {caption}
            </span>
            <PolaroidSignature
              className={`h-5 shrink-0 text-ink-you ${isLightbox ? 'w-16' : 'w-14'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
