import { Suspense, useEffect } from 'react';
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

  useEffect(() => {
    bindHead(route.titleKey, route.descriptionKey);
  }, [route, language]);

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
