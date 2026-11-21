import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Underline } from '@/components/ui/underline';
import { useReducedMotion } from '@/hooks/use-live-motion';
import { setLang, t, useLanguage } from '../shared/i18n';
import { Link, useRouter } from '../shared/router';
import { matchRoute, routes } from './routes';

const MobileNavSheet = lazy(() => import('./MobileNavSheet'));

gsap.registerPlugin(ScrollTrigger);

function StickyLogo({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className={className} fill="none">
      <path
        d="M5 4.5C11 3.8 18 4.2 22.5 4.6C23.2 10 23 18 22.3 23.2C16.5 23.8 10 23.5 5.2 23.1C4.6 17.5 4.8 10.5 5 4.5Z"
        fill="#fff18f"
        stroke="var(--ll-ink)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 4.3L22.6 9.4H17.8C17.4 7.7 17.4 6 17.5 4.3Z"
        fill="#ee6c3b"
        stroke="var(--ll-ink)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12.5H17M8.5 17H14.5"
        stroke="#3ea889"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M3.5 6C8 5.6 12 6.2 16.5 5.8" />
      <path d="M3.5 10.2C8.5 9.8 12.5 10.4 16.5 10" />
      <path d="M3.5 14.3C8 14 12.5 14.5 16.5 14.1" />
    </svg>
  );
}

export default function SiteHeader() {
  const language = useLanguage();
  const { path } = useRouter();
  const active = matchRoute(path).key;
  const [open, setOpen] = useState(false);
  const [sheetRequested, setSheetRequested] = useState(false);
  const [floating, setFloating] = useState(
    () => typeof window !== 'undefined' && window.scrollY > 48,
  );

  const barRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion(barRef);
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const floatingRef = useRef(floating);
  const setFloatingRef = useRef<((next: boolean, immediate?: boolean) => void) | null>(null);

  const toggleLanguage = () => setLang(language === 'zh' ? 'en' : 'zh');
  const toggleMenu = () => {
    setSheetRequested(true);
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const applyFloating = (next: boolean, immediate = false) => {
      const changed = floatingRef.current !== next;
      floatingRef.current = next;
      setFloating(next);

      gsap.killTweensOf(bar);
      if (immediate || reducedMotionRef.current || !changed) {
        gsap.set(bar, { clearProps: 'transform,opacity' });
        return;
      }

      if (next) {
        gsap.fromTo(
          bar,
          { y: -10, scale: 0.92 },
          {
            y: 0,
            scale: 1,
            duration: 0.34,
            ease: 'back.out(1.4)',
            force3D: true,
            overwrite: 'auto',
            clearProps: 'transform',
          },
        );
      } else {
        gsap.fromTo(
          bar,
          { y: -6 },
          {
            y: 0,
            duration: 0.26,
            ease: 'power3.out',
            force3D: true,
            overwrite: 'auto',
            clearProps: 'transform',
          },
        );
      }
    };

    setFloatingRef.current = applyFloating;
    applyFloating(window.scrollY > 48, true);

    const trigger = ScrollTrigger.create({
      start: 48,
      end: 'max',
      onEnter: () => applyFloating(true),
      onLeaveBack: () => applyFloating(false),
    });

    return () => {
      setFloatingRef.current = null;
      trigger.kill();
      gsap.killTweensOf(bar);
      gsap.set(bar, { clearProps: 'all' });
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    const shouldFloat = window.scrollY > 48;
    if (shouldFloat !== floatingRef.current) {
      setFloatingRef.current?.(shouldFloat);
    }
  }, [path]);

  return (
    <>
      <div className="h-14" aria-hidden="true" />
      <header
        className={`site-header pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center ${
          floating ? 'top-2.5' : 'top-0'
        }`}
      >
        <div
          ref={barRef}
          className={
            floating
              ? 'pointer-events-auto flex h-[38px] w-fit max-w-[calc(100vw-24px)] items-center gap-3 rounded-full border-[1.75px] border-ink bg-paper/98 px-3.5 shadow-[0_8px_20px_-8px_rgba(30,41,59,0.22),2px_2px_0_#1d242c]'
              : 'pointer-events-auto flex h-14 w-full items-center border-b border-pencil-mark/40 bg-paper/96 px-5 sm:px-8'
          }
        >
          <div
            className={
              floating
                ? 'flex items-center gap-3'
                : 'mx-auto flex w-full max-w-6xl items-center justify-between gap-4'
            }
          >
            <Link
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 font-script text-xl font-bold tracking-tight text-ink no-underline transition-transform hover:-rotate-1"
              to="/"
              aria-label={t('nav.home')}
            >
              <StickyLogo className={floating ? 'size-5 shrink-0' : 'size-6 shrink-0'} />
              <span className={floating ? 'sr-only' : 'whitespace-nowrap'}>{t('brand')}</span>
            </Link>

            <nav
              className={
                floating
                  ? 'hidden items-center gap-3 text-[14px] md:flex'
                  : 'hidden items-center gap-5 text-[16px] md:flex'
              }
              aria-label={t('nav.aria')}
            >
              {routes.map((route) => {
                const isCurrent = route.key === active;
                return (
                  <Link
                    key={route.key}
                    to={route.path}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={`cursor-pointer whitespace-nowrap font-hand font-bold no-underline transition-colors ${
                      isCurrent ? 'text-ink' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {isCurrent ? (
                      <Underline kind="double" tone="marker" seed={`nav-${route.key}`}>
                        {t(`nav.${route.key}`)}
                      </Underline>
                    ) : (
                      t(`nav.${route.key}`)
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className={floating ? 'flex shrink-0 items-center gap-1.5' : 'flex shrink-0 items-center gap-2'}>
              <Button
                type="button"
                variant="outline"
                size={floating ? 'xs' : 'sm'}
                seed="lang-toggle"
                aria-label={language === 'zh' ? 'Switch to English' : '切换到中文'}
                onClick={toggleLanguage}
                className="cursor-pointer font-mono text-xs font-bold tracking-wider"
              >
                {language === 'zh' ? 'EN' : '中'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size={floating ? 'icon-xs' : 'icon-sm'}
                seed="mobile-menu-trigger"
                onClick={toggleMenu}
                className="cursor-pointer md:hidden"
                aria-expanded={open}
                aria-label={t(open ? 'nav.close' : 'nav.menu')}
              >
                <MenuGlyph />
              </Button>
            </div>
          </div>
        </div>

        {!floating ? (
          <div className="pointer-events-none w-full">
            <Separator variant="pencil" seed="header-rule" className="opacity-80" />
          </div>
        ) : null}
      </header>

      {sheetRequested ? (
        <Suspense fallback={null}>
          <MobileNavSheet open={open} onOpenChange={setOpen} active={active} />
        </Suspense>
      ) : null}
    </>
  );
}
