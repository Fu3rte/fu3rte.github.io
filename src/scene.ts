import gsap from 'gsap';
import { t } from './i18n';

type Theme = 'dark' | 'light';

const THEME_KEY = 'theme';
const SECTION_IDS = ['home', 'about', 'work', 'skills', 'contact'] as const;

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// pin every pivot in absolute SVG user-space so a rotation/scale can never be
// resolved against the whole viewBox (which flings parts off the body)
function pivot(el: Element, origin: string): void {
  gsap.set(el, { svgOrigin: origin });
}

function onActivate(el: Element, handler: () => void): void {
  el.addEventListener('click', (event: Event) => {
    handler();
    // mouse clicks can leave a lingering :focus-visible outline on SVG
    // buttons in Chromium; keyboard activation (detail === 0) keeps focus
    if ((event as MouseEvent).detail > 0) (el as HTMLElement).blur();
  });
  el.addEventListener('keydown', (event: Event) => {
    const key = (event as KeyboardEvent).key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      handler();
    }
  });
}

function setupTheme(switchGroup: Element | null): void {
  const knob = document.querySelector('.f-switch');

  const applyKnob = (theme: Theme): void => {
    if (!knob) return;
    if (prefersReducedMotion()) {
      gsap.set(knob, { y: theme === 'dark' ? 10 : 0 });
    } else {
      gsap.to(knob, { y: theme === 'dark' ? 10 : 0, duration: 0.18, ease: 'power2.out' });
    }
  };

  const saved = localStorage.getItem(THEME_KEY);
  const initial: Theme = saved === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = initial;
  applyKnob(initial);

  const toggle = (): void => {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
    applyKnob(next);
  };

  const lamp = document.getElementById('lamp');
  if (lamp) onActivate(lamp, toggle);
  if (switchGroup) onActivate(switchGroup, toggle);
}

interface CatRig {
  head: Element;
  eyes: Element;
  earL: Element;
  earR: Element;
  body: Element;
  tail: Element;
  pawL: Element;
  pawR: Element;
}

// idle loops yield to the pet reaction instead of fighting it for the same property
let busy = false;

function startCursorFollow({ head, eyes }: CatRig): void {
  // eyes lead, head lags: the gap between them reads as follow-through, which is
  // what makes the turn feel weighted rather than mechanical
  const eyesX = gsap.quickTo(eyes, 'x', { duration: 0.4, ease: 'power3' });
  const eyesY = gsap.quickTo(eyes, 'y', { duration: 0.4, ease: 'power3' });
  const headX = gsap.quickTo(head, 'x', { duration: 0.9, ease: 'power3' });
  const headRot = gsap.quickTo(head, 'rotation', { duration: 0.9, ease: 'power3' });

  window.addEventListener('pointermove', (event: PointerEvent) => {
    const nx = (event.clientX / window.innerWidth) * 2 - 1;
    const ny = (event.clientY / window.innerHeight) * 2 - 1;
    eyesX(nx * 7);
    eyesY(ny * 5);
    headX(nx * 5);
    headRot(nx * 5);
  });
}

function startBlinkLoop(eyes: Element): void {
  const schedule = (): void => {
    gsap.delayedCall(2.4 + Math.random() * 2.6, () => {
      if (!busy) {
        const tl = gsap
          .timeline()
          .to(eyes, { scaleY: 0.08, duration: 0.07, ease: 'power2.inOut' })
          .to(eyes, { scaleY: 1, duration: 0.1, ease: 'power2.inOut' });
        if (Math.random() < 0.22) {
          tl.to(eyes, { scaleY: 0.08, duration: 0.07, ease: 'power2.inOut' }, '+=0.06').to(eyes, {
            scaleY: 1,
            duration: 0.1,
            ease: 'power2.inOut',
          });
        }
      }
      schedule();
    });
  };
  schedule();
}

function startBreathing(body: Element, head: Element): gsap.core.Timeline {
  // breathe from the belly, not the skull: the body swells off the desk and the
  // head rides it with a fainter scale so the two stay connected
  return gsap
    .timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
    .to(body, { scaleY: 1.035, scaleX: 1.012, duration: 2.6 }, 0)
    .to(head, { scaleY: 1.012, duration: 2.6 }, 0);
}

function startEarTwitchLoop(earL: Element, earR: Element): void {
  const schedule = (): void => {
    gsap.delayedCall(3 + Math.random() * 5, () => {
      if (!busy) {
        const left = Math.random() < 0.5;
        const ear = left ? earL : earR;
        const angle = (left ? -1 : 1) * (5 + Math.random() * 5);
        gsap.to(ear, {
          rotation: angle,
          duration: 0.12,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: 3,
        });
      }
      schedule();
    });
  };
  schedule();
}

function startTailSway(tail: Element): gsap.core.Timeline {
  // one timeline owns tail rotation so the idle sway and the sudden flick never
  // collide: lazy swing, lazy swing, snap, elastic settle
  return gsap
    .timeline({ repeat: -1 })
    .to(tail, { rotation: 7, duration: 2.4, ease: 'sine.inOut' })
    .to(tail, { rotation: -3, duration: 2.4, ease: 'sine.inOut' })
    .to(tail, { rotation: -14, duration: 0.18, ease: 'power2.out' })
    .to(tail, { rotation: 7, duration: 0.75, ease: 'elastic.out(1, 0.45)' })
    .to(tail, { rotation: 0, duration: 1.2, ease: 'sine.inOut' });
}

function startTyping(pawL: Element, pawR: Element): gsap.core.Timeline {
  // front paws tap the laptop in an uneven rhythm, then pause to "read"
  return gsap
    .timeline({
      repeat: -1,
      repeatDelay: 1.1,
      defaults: { duration: 0.13, ease: 'power2.inOut', yoyo: true, repeat: 1 },
    })
    .to(pawL, { y: 3, rotation: -3 }, 0)
    .to(pawR, { y: 3, rotation: 3 }, 0.16)
    .to(pawL, { y: 3, rotation: -3 }, 0.36)
    .to(pawR, { y: 3, rotation: 3 }, 0.52);
}

function spawnMeow(home: HTMLElement, anchor: Element): void {
  const label = document.createElement('span');
  label.className = 'meow';
  label.textContent = t('scene.meow');
  label.setAttribute('aria-hidden', 'true');
  home.appendChild(label);

  const homeRect = home.getBoundingClientRect();
  const anchorRect = anchor.getBoundingClientRect();
  gsap.set(label, {
    x: anchorRect.left - homeRect.left + anchorRect.width / 2,
    y: anchorRect.top - homeRect.top - 10,
    xPercent: -50,
  });
  gsap.to(label, {
    y: '-=48',
    opacity: 0,
    duration: 1.1,
    ease: 'power2.out',
    onComplete: () => label.remove(),
  });
}

function setupCatPetting(
  targets: Element[],
  rig: CatRig,
  loops: { breath: gsap.core.Timeline | null; tailSway: gsap.core.Timeline | null },
): void {
  const home = document.getElementById('home');
  const pet = (): void => {
    if (prefersReducedMotion() || busy) return;
    busy = true;
    if (home) spawnMeow(home, rig.head);
    loops.breath?.pause();
    loops.tailSway?.pause();
    // clear any in-flight ear twitch so it can't fight the flop (ears carry no quickTo)
    gsap.killTweensOf([rig.earL, rig.earR]);
    gsap
      .timeline({
        onComplete: () => {
          busy = false;
          loops.breath?.resume();
          loops.tailSway?.resume();
        },
      })
      // happy squint
      .to(rig.eyes, { scaleY: 0.1, duration: 0.09, ease: 'power2.out' }, 0)
      // nuzzle: squash the skull on the neck (scale only — cursor-follow owns head x/rotation)
      .to(rig.head, { scaleY: 0.9, scaleX: 1.06, duration: 0.12, ease: 'power2.out' }, 0)
      .to(rig.head, { scaleY: 1.04, scaleX: 0.98, duration: 0.2, ease: 'back.out(3)' }, 0.12)
      // ears flop back
      .to(rig.earL, { rotation: -15, duration: 0.14, ease: 'power2.out' }, 0)
      .to(rig.earR, { rotation: 15, duration: 0.14, ease: 'power2.out' }, 0)
      // tail lifts
      .to(rig.tail, { rotation: -16, duration: 0.2, ease: 'power2.out' }, 0)
      // purr wiggle through the body
      .to(rig.body, { rotation: 1.8, duration: 0.1, ease: 'sine.inOut', yoyo: true, repeat: 5 }, 0.16)
      // settle back to rest
      .to(rig.eyes, { scaleY: 1, duration: 0.16, ease: 'power2.inOut' }, 0.5)
      .to(rig.head, { scaleY: 1, scaleX: 1, duration: 0.35, ease: 'elastic.out(1, 0.5)' }, 0.45)
      .to(rig.earL, { rotation: 0, duration: 0.3, ease: 'power2.out' }, 0.5)
      .to(rig.earR, { rotation: 0, duration: 0.3, ease: 'power2.out' }, 0.5)
      .to(rig.tail, { rotation: 0, duration: 0.5, ease: 'power2.out' }, 0.5)
      .to(rig.body, { rotation: 0, duration: 0.3, ease: 'power2.out' }, 0.7);
  };
  for (const target of targets) onActivate(target, pet);
}

function setupCoffee(cup: Element, steam: Element | null): void {
  const pour = (): void => {
    if (prefersReducedMotion()) return;
    gsap
      .timeline()
      .to(cup, { rotation: -12, duration: 0.18, ease: 'power2.out' })
      .to(cup, { rotation: 0, duration: 0.4, ease: 'back.out(2)' });
    if (steam) {
      gsap.fromTo(
        steam,
        { opacity: 0.2, scale: 0.7, y: 6 },
        { opacity: 1, scale: 1.05, y: 0, duration: 0.5, ease: 'power2.out' },
      );
    }
  };
  onActivate(cup, pour);
}

function setupMailbox(mailbox: Element): void {
  const goToContact = (): void => {
    const contact = document.getElementById('contact');
    contact?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  onActivate(mailbox, goToContact);
}

function setupDockScrollSpy(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLAnchorElement>('.dock-btn'));
  if (buttons.length === 0) return;

  const setActive = (id: string): void => {
    for (const button of buttons) {
      button.classList.toggle('is-active', button.dataset.target === id);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id);
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );

  for (const id of SECTION_IDS) {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      if (button.dataset.target) setActive(button.dataset.target);
    });
  }
}

export function initScene(): void {
  setupTheme(document.getElementById('switch'));
  setupDockScrollSpy();

  const cat = document.getElementById('cat');
  const paws = document.getElementById('cat-paws');
  const head = document.getElementById('cat-head');
  const eyes = document.getElementById('cat-eyes');
  const earL = document.getElementById('ear-l');
  const earR = document.getElementById('ear-r');
  const body = document.getElementById('cat-body');
  const tail = document.getElementById('tail');
  const pawL = document.getElementById('paw-l');
  const pawR = document.getElementById('paw-r');
  if (!cat || !head || !eyes || !earL || !earR || !body || !tail || !pawL || !pawR) return;

  const rig: CatRig = { head, eyes, earL, earR, body, tail, pawL, pawR };
  // every pivot sits on a real joint, in scene coordinates
  pivot(head, '592 520'); // neck
  pivot(eyes, '592 464');
  pivot(earL, '573 430'); // ear base
  pivot(earR, '611 430');
  pivot(body, '592 648'); // planted on the desk
  pivot(tail, '652 604'); // tail base
  pivot(pawL, '547 525'); // wrist
  pivot(pawR, '635 525');

  const reduced = prefersReducedMotion();
  const breath = reduced ? null : startBreathing(body, head);
  const tailSway = reduced ? null : startTailSway(tail);
  if (!reduced) {
    startCursorFollow(rig);
    startBlinkLoop(eyes);
    startEarTwitchLoop(earL, earR);
    startTyping(pawL, pawR);
  }
  setupCatPetting(paws ? [cat, paws] : [cat], rig, { breath, tailSway });

  const cup = document.getElementById('cup');
  if (cup) {
    pivot(cup, '380 644');
    const steam = document.getElementById('steam');
    if (steam) pivot(steam, '379 582');
    setupCoffee(cup, steam);
  }

  const mailbox = document.getElementById('mailbox');
  if (mailbox) setupMailbox(mailbox);
}
