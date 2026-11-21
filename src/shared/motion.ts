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
  const header = document.querySelector('.site-header');
  if (header) {
    gsap.from(header, {
      opacity: 0,
      y: -14,
      duration: 0.6,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    });
  }

  const heroEnter = document.querySelectorAll<HTMLElement>('[data-st="hero-enter"]');
  if (heroEnter.length > 0) {
    gsap.from(heroEnter, {
      opacity: 0,
      y: 20,
      duration: 0.56,
      ease: 'power3.out',
      stagger: 0.08,
      delay: 0.08,
      clearProps: 'transform,opacity',
    });
  }
}

function setupHeroParallax(): void {
  const home = document.getElementById('home');
  if (!home) return;

  const copy = home.querySelector<HTMLElement>('[data-st="hero-copy"]');
  const layer1 = home.querySelector<HTMLElement>('[data-st="hero-layer-1"]');
  const layer2 = home.querySelector<HTMLElement>('[data-st="hero-layer-2"]');
  const layer3 = home.querySelector<HTMLElement>('[data-st="hero-layer-3"]');
  if (!copy && !layer1 && !layer2 && !layer3) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: home,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6,
    },
  });

  if (copy) tl.to(copy, { y: -24, ease: 'none', force3D: true }, 0);
  if (layer1) tl.to(layer1, { y: -44, rotate: -2, ease: 'none', force3D: true }, 0);
  if (layer2) tl.to(layer2, { y: -20, ease: 'none', force3D: true }, 0);
  if (layer3) tl.to(layer3, { y: -56, rotate: 2.2, ease: 'none', force3D: true }, 0);
}

function setupSectionHeadings(): void {
  const sections = document.querySelectorAll<HTMLElement>('.section');

  for (const section of sections) {
    const badge = section.querySelector<HTMLElement>('[data-st="sec-badge"]');
    const titles = section.querySelectorAll<HTMLElement>('.section-title');
    const intro = section.querySelectorAll<HTMLElement>('header .reveal');
    const rule = section.querySelector<HTMLElement>('[data-st="sec-rule"]');

    if (!badge && titles.length === 0 && intro.length === 0 && !rule) continue;

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 86%', once: true },
    });

    if (badge) {
      tl.from(badge, {
        opacity: 0,
        scale: 0.84,
        rotate: -6,
        duration: 0.42,
        ease: 'back.out(1.7)',
        clearProps: 'transform,opacity',
      });
    }

    if (titles.length > 0) {
      tl.from(
        titles,
        {
          opacity: 0,
          y: 20,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.08,
          clearProps: 'transform,opacity',
        },
        badge ? '-=0.25' : 0,
      );
    }

    if (intro.length > 0) {
      tl.from(
        intro,
        {
          opacity: 0,
          y: 14,
          duration: 0.46,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
        badge || titles.length > 0 ? '-=0.3' : 0,
      );
    }

    if (rule) {
      tl.from(
        rule,
        {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 0.55,
          ease: 'power2.out',
          clearProps: 'transform',
        },
        badge || titles.length > 0 || intro.length > 0 ? '-=0.32' : 0,
      );
    }
  }
}

function setupPaperAndStickies(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-st="paper-drop"]')) {
    gsap.from(el, {
      opacity: 0,
      y: 26,
      duration: 0.56,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: el, start: 'top 87%', once: true },
    });
  }

  for (const el of document.querySelectorAll<HTMLElement>('[data-st="sticky-pop"]')) {
    gsap.from(el, {
      opacity: 0,
      y: 18,
      scale: 0.93,
      rotate: 2.5,
      duration: 0.5,
      ease: 'back.out(1.45)',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: el, start: 'top 87%', once: true },
    });
  }

  for (const group of document.querySelectorAll<HTMLElement>('[data-st="sticky-group"]')) {
    const items = group.querySelectorAll<HTMLElement>('[data-st="sticky-item"]');
    if (items.length === 0) continue;

    gsap.from(items, {
      opacity: 0,
      y: 24,
      scale: 0.96,
      duration: 0.5,
      ease: 'back.out(1.25)',
      stagger: 0.1,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: group, start: 'top 86%', once: true },
    });
  }
}

function setupWorksMotion(): void {
  for (const mat of document.querySelectorAll<HTMLElement>('[data-st="folio-mat"]')) {
    gsap.from(mat, {
      opacity: 0,
      y: 22,
      duration: 0.54,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: mat, start: 'top 88%', once: true },
    });
  }

  const cards = document.querySelectorAll<HTMLElement>('[data-st="work-card"]');
  cards.forEach((card, idx) => {
    const nodes = card.querySelectorAll<HTMLElement>('[data-st="cover-node"]');
    const edges = card.querySelectorAll<HTMLElement>('[data-st="cover-edge"]');

    const tl = gsap.timeline({
      scrollTrigger: { trigger: card, start: 'top 86%', once: true },
    });

    tl.from(card, {
      x: idx % 2 === 0 ? -18 : 18,
      y: 24,
      opacity: 0,
      duration: 0.56,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    });

    if (nodes.length > 0) {
      tl.from(
        nodes,
        {
          opacity: 0,
          y: 10,
          stagger: 0.1,
          duration: 0.36,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
        '-=0.25',
      );
    }

    if (edges.length > 0) {
      tl.from(
        edges,
        {
          opacity: 0,
          stagger: 0.1,
          duration: 0.3,
          ease: 'power2.out',
          clearProps: 'opacity',
        },
        '-=0.3',
      );
    }
  });
}

function setupLabWake(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-st-lab]')) {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        el.dispatchEvent(new CustomEvent('lab-enter'));
      },
    });
  }
}

function setupPhotoMotion(): void {
  for (const deck of document.querySelectorAll<HTMLElement>('[data-st="photo-deck"]')) {
    gsap.from(deck, {
      opacity: 0,
      y: 28,
      scale: 0.96,
      duration: 0.58,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: deck, start: 'top 86%', once: true },
    });
  }

  if (window.matchMedia('(min-width: 1024px)').matches) {
    const previewTrigger = document.getElementById('photo-preview');
    for (const el of document.querySelectorAll<HTMLElement>('[data-st="photo-index-scrub"]')) {
      gsap.fromTo(
        el,
        { y: 16, force3D: true },
        {
          y: -16,
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: previewTrigger ?? el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.7,
          },
        },
      );
    }
  }

  const polaroids = document.querySelectorAll<HTMLElement>('[data-st="polaroid-tile"]');
  if (polaroids.length > 0) {
    gsap.set(polaroids, { opacity: 0 });
    ScrollTrigger.batch(polaroids, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => {
        gsap.fromTo(
          batch,
          { opacity: 0, y: 30, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.52,
            ease: 'power3.out',
            stagger: 0.08,
            clearProps: 'transform,opacity',
            overwrite: true,
          },
        );
      },
    });
  }
}

function setupCaseStudyMotion(): void {
  const blocks = [...document.querySelectorAll<HTMLElement>('[data-st="case-block"]')];
  const tocLinks = document.querySelectorAll<HTMLAnchorElement>('[data-st="case-toc-link"]');
  if (blocks.length === 0) return;

  let lastActiveId = '';
  const setActiveToc = (id: string): void => {
    if (!id || id === lastActiveId) return;
    lastActiveId = id;
    for (const link of tocLinks) {
      const href = link.getAttribute('href');
      link.setAttribute('data-active', href === `#${id}` ? 'true' : 'false');
    }
  };

  for (const block of blocks) {
    gsap.from(block, {
      opacity: 0,
      y: 20,
      duration: 0.5,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: block, start: 'top 86%', once: true },
    });
  }

  if (tocLinks.length > 0) {
    let blockTops: number[] = [];
    let maxScrollBottom = 0;

    const measureBlocks = (): void => {
      const scrollY = window.scrollY;
      blockTops = blocks.map(block => Math.round(block.getBoundingClientRect().top + scrollY));
      maxScrollBottom = document.documentElement.scrollHeight - 28;
    };

    const syncActiveTocFromScroll = (): void => {
      if (blockTops.length === 0) measureBlocks();
      const scrollY = window.scrollY;
      if (window.innerHeight + scrollY >= maxScrollBottom) {
        const last = blocks[blocks.length - 1];
        if (last?.id) setActiveToc(last.id);
        return;
      }

      const focusDocY = scrollY + window.innerHeight * 0.42;
      let activeId = blocks[0]?.id ?? '';
      for (let i = 0; i < blocks.length; i += 1) {
        const block = blocks[i];
        if (block.id && blockTops[i] <= focusDocY) {
          activeId = block.id;
        }
      }
      setActiveToc(activeId);
    };

    measureBlocks();
    const scope = blocks[0]!.parentElement ?? document.documentElement;
    ScrollTrigger.create({
      trigger: scope,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: syncActiveTocFromScroll,
      onRefresh: () => {
        measureBlocks();
        syncActiveTocFromScroll();
      },
    });
    syncActiveTocFromScroll();
  }
}

function setupRemainingReveals(): void {
  for (const el of document.querySelectorAll<HTMLElement>('.reveal:not([data-st])')) {
    if (el.closest('header')) continue;
    gsap.from(el, {
      opacity: 0,
      y: 20,
      duration: 0.52,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  }
}

export function initMotion(): () => void {
  // 换语言会改写文案长度、整页位移，滚动锚点必须重算
  const refresh = (): void => { ScrollTrigger.refresh(); };
  document.addEventListener('langchange', refresh);

  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    let bar: HTMLDivElement | null = null;
    let run: gsap.Context | null = null;
    const cancel = onLoaderDone(() => {
      // 放行那一拍才创建，这批动效长在 matchMedia 的作用域之外，另立一份上下文交给卸载清账
      run = gsap.context(() => {
        bar = createProgressBar();
        playIntro();
        setupHeroParallax();
        setupSectionHeadings();
        setupPaperAndStickies();
        setupWorksMotion();
        setupLabWake();
        setupPhotoMotion();
        setupCaseStudyMotion();
        setupRemainingReveals();
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      });
    });
    return () => {
      cancel();
      run?.revert();
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
