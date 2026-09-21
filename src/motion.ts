import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function createProgressBar(): void {
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
}

function playIntro(): void {
  gsap
    .timeline({ defaults: { ease: 'power4.out' } })
    .from('.hero-type span', { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.12 })
    .from('#scene', { opacity: 0, scale: 0.96, duration: 1 }, 0.1)
    .from('.topbar', { opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.4)
    .from('.hero-kicker', { opacity: 0, y: 20, duration: 0.7 }, 0.5)
    .from('.dock', { y: 80, opacity: 0, duration: 0.8 }, 0.55)
    .from('.scroll-hint', { opacity: 0, y: 16, duration: 0.6, ease: 'power2.out' }, 0.8);
}

function setupSectionReveals(): void {
  const sections = document.querySelectorAll<HTMLElement>('.section');

  for (const section of sections) {
    const reveals = Array.from(section.querySelectorAll<HTMLElement>('.reveal')).filter(
      (el) => !el.matches('#work .card') && !el.matches('#skills .tags.big'),
    );

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 75%', once: true },
    });

    tl.from(section.querySelectorAll('.section-index, .section-title'), {
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

    if (section.id === 'work') {
      // cards settle in; resting rotation stays in CSS (nth-child rules)
      tl.from(
        section.querySelectorAll('.card'),
        { opacity: 0, y: 60, duration: 0.9, ease: 'power3.out', stagger: 0.12 },
        '-=0.5',
      );
    }

    if (section.id === 'skills') {
      tl.from(
        section.querySelectorAll('.tags.big li'),
        { opacity: 0, y: 24, scale: 0.9, duration: 0.5, ease: 'back.out(2)', stagger: 0.05 },
        '-=0.5',
      );
    }
  }
}

function setupParallax(): void {
  const heroType = document.querySelector('.hero-type');
  const scene = document.querySelector('#scene');
  const shared = {
    trigger: '#home',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  } as const;

  // gsap fully owns the headline transform: x/y are pinned to 0 so no parsed
  // pixel offset (stylesheet translate or pre-webfont matrix) can leak into
  // the percent-based centering and shift it off-center.
  // desktop rests at the editorial high position and drifts up 18%;
  // mobile centers the headline on the stage and drifts up 18%.
  if (heroType) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 641px)', () => {
      gsap.fromTo(
        heroType,
        { x: 0, y: 0, xPercent: -50, yPercent: -104 },
        { x: 0, y: 0, xPercent: -50, yPercent: -122, ease: 'none', scrollTrigger: shared },
      );
    });
    mm.add('(max-width: 640px)', () => {
      gsap.fromTo(
        heroType,
        { x: 0, y: 0, xPercent: -50, yPercent: -50 },
        { x: 0, y: 0, xPercent: -50, yPercent: -68, ease: 'none', scrollTrigger: shared },
      );
    });
  }
  if (scene) {
    gsap.fromTo(scene, { yPercent: 0 }, { yPercent: 8, ease: 'none', scrollTrigger: shared });
  }
}

function setupSunRays(): void {
  const rays = document.querySelector('#sun .sun-rays');
  if (!rays) return;
  // explicit SVG-space origin (the sun circle's center in the viewBox) so the
  // burst stays glued to the sun at every viewport scale — CSS transform-box
  // origins double-compensate with gsap's matrix and detach the rays.
  gsap.to(rays, { rotation: 360, duration: 40, ease: 'none', repeat: -1, svgOrigin: '252 182' });
}

export function initMotion(): void {
  // 换语言会改写文案长度、整页位移，滚动锚点必须重算
  document.addEventListener('langchange', () => {
    ScrollTrigger.refresh();
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  createProgressBar();
  playIntro();
  setupSectionReveals();
  setupParallax();
  setupSunRays();

  document.fonts.ready.then(() => {
    ScrollTrigger.refresh();
  });
}
