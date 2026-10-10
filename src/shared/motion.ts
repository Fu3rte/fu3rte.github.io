import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onLoaderDone } from './loader';

gsap.registerPlugin(ScrollTrigger);

function createProgressBar(): HTMLDivElement {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  gsap.fromTo(
    bar,
    { scaleX: 0 },
    {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      },
    },
  );
  return bar;
}

function playIntro(): void {
  const scene = document.querySelector('.brook-scene');
  if (!scene) return;
  gsap.from(scene, { opacity: 0, scale: 0.96, duration: 1, delay: 0.1, ease: 'power4.out' });
}

function setupSectionReveals(): void {
  const sections = document.querySelectorAll<HTMLElement>('.section');

  for (const section of sections) {
    const reveals = section.querySelectorAll<HTMLElement>('.reveal');

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 75%', once: true },
    });

    tl.from(section.querySelectorAll('.section-title'), {
      opacity: 0,
      y: 32,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.1,
    });

    if (reveals.length > 0) {
      tl.from(
        reveals,
        { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out', stagger: 0.12 },
        '-=0.4',
      );
    }

  }
}

export function initMotion(): () => void {
  // 换语言会改写文案长度、整页位移，滚动锚点必须重算
  const refresh = (): void => { ScrollTrigger.refresh(); };
  document.addEventListener('langchange', refresh);

  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    let bar: HTMLDivElement | null = null;
    const cancel = onLoaderDone(() => {
      bar = createProgressBar();
      playIntro();
      setupSectionReveals();
    });
    return () => {
      cancel();
      bar?.remove();
    };
  });

  let mounted = true;
  document.fonts.ready.then(() => {
    if (mounted) refresh();
  });
  return () => {
    mounted = false;
    document.removeEventListener('langchange', refresh);
    media.revert();
  };
}
