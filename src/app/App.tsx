import { Suspense, useEffect, useRef } from 'react';
import { RouterProvider, useRouter } from '../shared/router';
import { bindHead, useLanguage } from '../shared/i18n';
import { InkProvider } from '../lib/ink/react';
import SiteHeader from './SiteHeader';
import { matchRoute } from './routes';

const TEXTURES = ['relief', 'slip'] as const;

function Shell() {
  const language = useLanguage();
  const { path } = useRouter();
  const route = matchRoute(path);
  const prevLang = useRef(language);

  useEffect(() => {
    bindHead(route.titleKey, route.descriptionKey);
  }, [route, language]);

  useEffect(() => {
    if (prevLang.current === language) return;
    prevLang.current = language;
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lng: language } }));
  }, [language]);

  const Page = route.Component;
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <InkProvider defs={false} textures={TEXTURES}>
      <RouterProvider>
        <Shell />
      </RouterProvider>
    </InkProvider>
  );
}
