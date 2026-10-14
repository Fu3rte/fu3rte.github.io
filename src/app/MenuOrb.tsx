import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import gsap from 'gsap';
import { t } from '../shared/i18n';
import { Link, useRouter } from '../shared/router';
import { matchRoute, routes, type RouteKey } from './routes';

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function HomeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3.4 10.8 12 3.8l8.6 7v9.6a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6Z" />
      <path d="M9.4 22.6v-6.8h5.2v6.8" />
    </svg>
  );
}

function PhotosIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2.6" y="6.8" width="18.8" height="13.4" rx="3.2" />
      <path d="M8.6 6.8 10 3.9h4l1.4 2.9" />
      <circle cx="12" cy="13.5" r="3.7" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2.6" y="5" width="18.8" height="14" rx="3.2" />
      <path d="m3.6 7.2 8.4 6.2 8.4-6.2" />
    </svg>
  );
}

const ICONS: Record<RouteKey, ComponentType> = { home: HomeIcon, photos: PhotosIcon, contact: ContactIcon };

export default function MenuOrb() {
  const rootRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [open, setOpen] = useState(false);
  const { path } = useRouter();
  const active = matchRoute(path).key;

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const ctx = gsap.context(() => {
      const trigger = root.querySelector<HTMLElement>('.orb-trigger')!;
      const list = root.querySelector<HTMLElement>('.orb-list')!;
      const cells = gsap.utils.toArray<HTMLElement>('.orb-cell');

      // 列表绝对定位，不参与容器 auto 高度，展开高度按几何相加
      const collapsed = trigger.offsetHeight;
      const expanded = collapsed + list.offsetHeight;

      // 降低动效偏好下时间轴整体瞬时完成，只保留状态切换
      const d = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.001 : 1;

      gsap.set(root, { height: collapsed });
      // autoAlpha 写入的是 visibility:inherit，同帧内子元素计算值会滞后，这里显式收发可见性
      gsap.set(cells, { opacity: 0, visibility: 'hidden', scale: 0.35, y: -10 });

      timelineRef.current = gsap
        .timeline({ paused: true })
        .to('.orb-bar-center', { attr: { x: 100, width: 0 }, duration: 0.26 * d, ease: 'power2.in' }, 0)
        .to('.orb-bar-top', { y: 52.5, duration: 0.3 * d, ease: 'power3.out' }, 0)
        .to('.orb-bar-bottom', { y: -52.5, duration: 0.3 * d, ease: 'power3.out' }, 0)
        .to('.orb-wrap-top', { rotation: 45, svgOrigin: '100 100', duration: 0.34 * d, ease: 'back.inOut(1.4)' }, 0.12 * d)
        .to('.orb-wrap-bottom', { rotation: -45, svgOrigin: '100 100', duration: 0.34 * d, ease: 'back.inOut(1.4)' }, 0.12 * d)
        .to(root, { height: expanded, duration: 0.46 * d, ease: 'back.inOut(1.25)' }, 0)
        .set(cells, { visibility: 'visible' }, 0.2 * d)
        .to(cells, { opacity: 1, scale: 1, y: 0, duration: 0.3 * d, ease: 'back.out(2)', stagger: 0.06 * d }, 0.2 * d);
    }, root);

    return () => {
      ctx.revert();
      timelineRef.current = null;
    };
  }, []);

  const collapse = useCallback(() => {
    setOpen(false);
    timelineRef.current?.reverse();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') collapse();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) collapse();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open, collapse]);

  return (
    <nav ref={rootRef} className="orb" data-open={open} aria-label={t('nav.aria')}>
      <button
        type="button"
        className="orb-trigger"
        aria-expanded={open}
        aria-controls="orb-list"
        onClick={() => {
          setOpen(!open);
          if (open) timelineRef.current?.reverse();
          else timelineRef.current?.play();
        }}
      >
        <svg className="orb-burger" viewBox="0 0 200 200" aria-hidden="true">
          <g className="orb-wrap-top">
            <rect className="orb-bar-top" x="20" y="37.5" width="160" height="20" rx="10" />
          </g>
          <rect className="orb-bar-center" x="20" y="87.5" width="140" height="20" rx="10" />
          <g className="orb-wrap-bottom">
            <rect className="orb-bar-bottom" x="20" y="142.5" width="160" height="20" rx="10" />
          </g>
        </svg>
      </button>
      <ul className="orb-list" id="orb-list">
        {routes.map(item => {
          const Icon = ICONS[item.key];
          const current = item.key === active;
          const label = t(`nav.${item.key}`);
          return (
            <li className="orb-cell" key={item.key}>
              <Link
                to={item.path}
                onClick={collapse}
                className={'orb-item' + (current ? ' is-current' : '')}
                aria-label={label}
                title={label}
                aria-current={current ? 'page' : undefined}
              >
                <Icon />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
