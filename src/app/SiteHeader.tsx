import { useEffect, useRef, useState } from 'react';
import { setLang, t, useLanguage } from '../shared/i18n';
import { Link, useRouter } from '../shared/router';
import { matchRoute, routes } from './routes';

export default function SiteHeader() {
  const language = useLanguage();
  const { path } = useRouter();
  const active = matchRoute(path).key;
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <header className="site-header">
      <Link className="site-brand" to="/" aria-label={t('nav.home')}>
        <span className="brand-lattice" aria-hidden="true" />
        <span>{t('brand')}</span>
      </Link>
      <nav className="desktop-nav" aria-label={t('nav.aria')}>
        {routes.map(route => (
          <Link
            key={route.key}
            to={route.path}
            className={route.key === active ? 'is-current' : ''}
            aria-current={route.key === active ? 'page' : undefined}
          >
            {t(`nav.${route.key}`)}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <button
          type="button"
          className="language-toggle"
          aria-label={language === 'zh' ? 'Switch to English' : '切换到中文'}
          onClick={() => setLang(language === 'zh' ? 'en' : 'zh')}
        >
          {language === 'zh' ? 'EN' : '中'}
        </button>
        <button
          ref={trigger}
          type="button"
          className="menu-toggle"
          aria-label={t(open ? 'nav.close' : 'nav.menu')}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(value => !value)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
      <nav id="mobile-nav" className="mobile-nav" data-open={open} aria-label={t('nav.aria')}>
        {routes.map((route, index) => (
          <Link
            key={route.key}
            to={route.path}
            tabIndex={open ? 0 : -1}
            className={route.key === active ? 'is-current' : ''}
            aria-current={route.key === active ? 'page' : undefined}
          >
            <span className="mono">0{index + 1}</span>{t(`nav.${route.key}`)}
          </Link>
        ))}
      </nav>
    </header>
  );
}
