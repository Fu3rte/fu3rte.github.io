import { useEffect, useRef } from 'react';
import lottie from 'lottie-web/build/player/lottie_light';
import type { Rive } from '@rive-app/canvas';
import { t } from '../../shared/i18n';
import { onLoaderDone } from '../../shared/loader';
import hoodedSkull from './assets/hooded-skull.svg?raw';

const art = hoodedSkull.replace(/^<svg[^>]*>|<\/svg>\s*$/g, '');
const WASM = '/rive/rive.wasm';
const EYES = '/rive/hero-eyes.riv';

export default function DeskSignature() {
  const scene = useRef<HTMLDivElement>(null);
  const steam = useRef<HTMLDivElement>(null);
  const eyes = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animation = lottie.loadAnimation({
      container: steam.current!,
      renderer: 'svg',
      loop: true,
      autoplay: !reduced,
      path: '/lottie/steam.json',
    });
    if (reduced) animation.addEventListener('data_ready', () => animation.goToAndStop(45, true));
    return () => animation.destroy();
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let rive: Rive | null = null;
    let observer: ResizeObserver | null = null;
    let disposed = false;
    const cancel = onLoaderDone(() => {
      void import('@rive-app/canvas').then(({ Rive: Runtime, RuntimeLoader }) => {
        if (disposed) return;
        RuntimeLoader.setWasmUrl(WASM);
        RuntimeLoader.setWasmFallbackUrl(null);
        const canvas = eyes.current!;
        rive = new Runtime({
          canvas,
          src: EYES,
          stateMachine: 'Blink',
          autoplay: true,
          enableRiveAssetCDN: false,
          onLoad: () => {
            if (disposed) return;
            rive?.drawFrame();
            scene.current?.classList.add('eyes-live');
          },
        });
        observer = new ResizeObserver(() => rive?.resizeToCanvas());
        observer.observe(canvas);
      });
    });
    return () => {
      disposed = true;
      cancel();
      observer?.disconnect();
      rive?.stop();
      rive?.cleanup();
    };
  }, []);

  return (
    <figure className="desk-signature reveal" aria-label={t('hero.aria')}>
      <div className="signature-scene" ref={scene}>
        <svg className="signature-art" viewBox="0 0 2198 1254" aria-hidden="true">
          <g transform="translate(472 0)" fill="none" dangerouslySetInnerHTML={{ __html: art }} />
          <g transform="translate(174 0)" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M110 1000V1074C110 1121 145 1150 200 1150C255 1150 290 1121 290 1074V997" fill="var(--surface)" />
            <path d="M128 983H268C281 983 290 989 290 997" />
            <path d="M290 1018C327 1021 356 1040 356 1061C356 1086 332 1102 290 1102" />
          </g>
          <path d="M50 1150H2150" stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none" />
        </svg>
        <canvas className="signature-eyes" ref={eyes} aria-hidden="true" />
        <div className="signature-steam" ref={steam} aria-hidden="true" />
      </div>
      <figcaption className="mono">FINNIAN / AFTER HOURS</figcaption>
    </figure>
  );
}
